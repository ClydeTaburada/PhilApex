import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { assignJobOrderSchema } from "@/lib/schemas";
import { writeAuditLog } from "@/lib/audit";
import { syncJobOrderSlots } from "@/lib/data/job-orders";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { staff } = await requireStaffApiContext();
    const supabaseAdmin = getSupabaseAdminClient();

    const payload = await request.json();
    const parsed = assignJobOrderSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: currentApplicant, error: loadError } = await supabaseAdmin
      .from("applicants")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !currentApplicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const newJobOrderId = parsed.data.job_order_id;

    // Get current assignments
    const { data: currentAssignments } = await supabaseAdmin
      .from("applicant_job_orders")
      .select("job_order_id")
      .eq("applicant_id", id);
    
    const oldJobOrderIds = ((currentAssignments as any[]) ?? []).map(a => a.job_order_id);
    const oldJobOrderId = oldJobOrderIds.length > 0 ? oldJobOrderIds[0] : null;

    if (oldJobOrderId === newJobOrderId) {
      return NextResponse.json({ ok: true }); // No change
    }

    // Delete old
    await supabaseAdmin
      .from("applicant_job_orders")
      .delete()
      .eq("applicant_id", id);

    // Insert new
    if (newJobOrderId) {
      const { error: insertError } = await (supabaseAdmin as any)
        .from("applicant_job_orders")
        .insert({ applicant_id: id, job_order_id: newJobOrderId });
      
      if (insertError) {
        return NextResponse.json({ error: "Unable to assign job order" }, { status: 500 });
      }
    }

    await writeAuditLog({
      staff_id: staff.id,
      applicant_id: id,
      action_type: "applicant_update",
      field_changed: "assigned_job_order",
      old_value: oldJobOrderId || "none",
      new_value: newJobOrderId || "none",
    });

    // Sync slots
    const jobsToSync = new Set([...oldJobOrderIds]);
    if (newJobOrderId) jobsToSync.add(newJobOrderId);
    
    await Promise.all(
      Array.from(jobsToSync).map((jobId) => syncJobOrderSlots(jobId))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
