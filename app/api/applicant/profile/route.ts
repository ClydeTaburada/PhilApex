import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApplicantSession } from "@/lib/applicant-auth";
import { applicantProfileUpdateSchema } from "@/lib/schemas";
import { writeApplicantAuditLog } from "@/lib/audit";

export async function PATCH(request: Request) {
  try {
    const session = await getApplicantSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = applicantProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // Filter out undefined values — only update fields the applicant actually sent
    const fieldsToUpdate: Record<string, string | null> = {};
    if (updates.cellphone_number !== undefined) fieldsToUpdate.cellphone_number = updates.cellphone_number;
    if (updates.email !== undefined) fieldsToUpdate.email = updates.email || null;
    if (updates.home_address !== undefined) fieldsToUpdate.home_address = updates.home_address || null;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch current values for audit log
    const { data: current } = await (supabase as any)
      .from("applicants")
      .select("cellphone_number, email, home_address")
      .eq("id", session.applicant_id)
      .single();

    // Update only the allowed contact fields
    const { error: updateError } = await (supabase as any)
      .from("applicants")
      .update(fieldsToUpdate)
      .eq("id", session.applicant_id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Audit log for each changed field
    for (const [field, newValue] of Object.entries(fieldsToUpdate)) {
      const oldValue = current?.[field] ?? null;
      if (oldValue !== newValue) {
        await writeApplicantAuditLog({
          applicant_id: session.applicant_id,
          action_type: "applicant_profile_update",
          field_changed: field,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
