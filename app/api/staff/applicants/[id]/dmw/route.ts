import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { updateDmwSchema } from "@/lib/schemas";
import { writeAuditLog } from "@/lib/audit";
import { toNullableString } from "@/lib/utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { supabase, staff } = await requireStaffApiContext();

    const payload = await request.json();
    const parsed = updateDmwSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid DMW payload" }, { status: 400 });
    }

    const newValue = toNullableString(parsed.data.dmw_registration_number);

    const { data: currentApplicant, error: loadError } = await supabase
      .from("applicants")
      .select("id, dmw_registration_number")
      .eq("id", id)
      .maybeSingle();

    if (loadError || !currentApplicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }

    const oldValue = currentApplicant.dmw_registration_number;

    const { error: updateError } = await supabase
      .from("applicants")
      .update({ dmw_registration_number: newValue })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Unable to update DMW registration number" }, { status: 500 });
    }

    await writeAuditLog({
      staff_id: staff.id,
      applicant_id: id,
      action_type: "applicant_update",
      field_changed: "dmw_registration_number",
      old_value: oldValue,
      new_value: newValue,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
