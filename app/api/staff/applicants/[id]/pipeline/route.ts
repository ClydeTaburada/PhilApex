import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { updateApplicantPipelineSchema } from "@/lib/schemas";
import { writeAuditLog } from "@/lib/audit";
import { syncJobOrderSlots } from "@/lib/data/job-orders";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { supabase, staff } = await requireStaffApiContext();

    const payload = await request.json();
    const parsed = updateApplicantPipelineSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pipeline payload" }, { status: 400 });
    }

    const { data: currentApplicant, error: loadError } = await supabase
      .from("applicants")
      .select("id, current_pipeline_stage")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !currentApplicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const oldValue = currentApplicant.current_pipeline_stage;
    const newValue = parsed.data.current_pipeline_stage;

    const { error: updateError } = await supabase
      .from("applicants")
      .update({ current_pipeline_stage: newValue })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Unable to update pipeline stage" }, { status: 500 });
    }

    await writeAuditLog({
      staff_id: staff.id,
      applicant_id: id,
      action_type: "applicant_update",
      field_changed: "current_pipeline_stage",
      old_value: oldValue,
      new_value: newValue,
    });

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: aj } = await supabaseAdmin
      .from("applicant_job_orders")
      .select("job_order_id")
      .eq("applicant_id", id);
    if (aj && aj.length > 0) {
      await Promise.all((aj as any[]).map((a) => syncJobOrderSlots(a.job_order_id)));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
