import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertDeploymentSchema } from "@/lib/schemas";
import { getDeploymentsByBatch } from "@/lib/data/batches";
import { getAccreditationById, getExpiryTier } from "@/lib/data/accreditations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffContext();
    const { id: batchId } = await params;
    const deployments = await getDeploymentsByBatch(batchId);
    return NextResponse.json(deployments);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: batchId } = await params;
    const body = await req.json();

    // Expiry soft-warning check — client sends confirmed: true to bypass
    const overrideConfirmed = body.override_confirmed === true;

    const parsed = upsertDeploymentSchema.safeParse({ ...body, batch_id: batchId });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Prevent adding if applicant is already in an active deployment
    const { data: existingActive } = await (supabase as any)
      .from("deployments")
      .select("id, batch:batches(batch_label)")
      .eq("applicant_id", parsed.data.applicant_id)
      .is("deployment_end_date", null)
      .maybeSingle();

    if (existingActive) {
      const bLabel = Array.isArray(existingActive.batch) 
        ? existingActive.batch[0]?.batch_label 
        : existingActive.batch?.batch_label;
      return NextResponse.json({ 
        error: `Applicant is already actively assigned to batch ${bLabel || 'another batch'}.` 
      }, { status: 409 });
    }

    // Look up parent accreditation via batch → job_order → accreditation
    const { data: batchData } = await (supabase as any)
      .from("batches")
      .select("job_order_id, job_order:job_orders!job_order_id(accreditation_id, jo_validity_date)")
      .eq("id", batchId)
      .maybeSingle();

    const jo = Array.isArray((batchData as any)?.job_order)
      ? (batchData as any).job_order[0]
      : (batchData as any)?.job_order;

    const accreditationId = jo?.accreditation_id;
    const joValidityDate = jo?.jo_validity_date;

    // Check job order validity date
    if (joValidityDate && !overrideConfirmed) {
      const jotier = getExpiryTier(joValidityDate);
      if (jotier === "expired") {
        return NextResponse.json(
          {
            warning: true,
            warning_type: "jo_expired",
            expiration_date: joValidityDate,
            message: `This job order's validity date was ${joValidityDate}. Confirm this has been renewed before proceeding.`,
          },
          { status: 409 }
        );
      }
    }

    // Check accreditation expiry
    if (accreditationId && !overrideConfirmed) {
      const acc = await getAccreditationById(accreditationId);
      if (acc && acc.expiry_tier === "expired") {
        return NextResponse.json(
          {
            warning: true,
            warning_type: "accreditation_expired",
            expiration_date: acc.date_expiration,
            message: `This accreditation's recorded expiration was ${acc.date_expiration}. Confirm this has been renewed on DMW before proceeding.`,
            accreditation_id: accreditationId,
          },
          { status: 409 }
        );
      }
    }

    // If override was confirmed, log it
    if (overrideConfirmed && accreditationId) {
      await (supabase as any).from("audit_log").insert({
        staff_id: context.staff.id,
        applicant_id: parsed.data.applicant_id,
        accreditation_id: accreditationId,
        action_type: "accreditation_override",
        field_changed: "deployment_created",
        old_value: null,
        new_value: `batch_id=${batchId}`,
      });
    }

    const { id: _id, ...insertData } = parsed.data;
    const { data, error } = await (supabase as any)
      .from("deployments")
      .insert(insertData)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
