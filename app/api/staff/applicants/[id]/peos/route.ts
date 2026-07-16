import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { updatePeosSchema } from "@/lib/schemas";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { supabase, staff } = await requireStaffApiContext();

    const payload = await request.json();
    const parsed = updatePeosSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid PEOS payload" }, { status: 400 });
    }

    const { data: currentApplicant, error: loadError } = await supabase
      .from("applicants")
      .select("id, peos_modules_completed, peos_certificate_status")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !currentApplicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("applicants")
      .update({
        peos_modules_completed: parsed.data.peos_modules_completed,
        peos_certificate_status: parsed.data.peos_certificate_status,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Unable to update PEOS fields" }, { status: 500 });
    }

    if (currentApplicant.peos_modules_completed !== parsed.data.peos_modules_completed) {
      await writeAuditLog({
        staff_id: staff.id,
        applicant_id: id,
        action_type: "applicant_update",
        field_changed: "peos_modules_completed",
        old_value: String(currentApplicant.peos_modules_completed),
        new_value: String(parsed.data.peos_modules_completed),
      });
    }

    if (currentApplicant.peos_certificate_status !== parsed.data.peos_certificate_status) {
      await writeAuditLog({
        staff_id: staff.id,
        applicant_id: id,
        action_type: "applicant_update",
        field_changed: "peos_certificate_status",
        old_value: currentApplicant.peos_certificate_status,
        new_value: parsed.data.peos_certificate_status,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
