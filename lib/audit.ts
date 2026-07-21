import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Write an audit log entry for staff-initiated actions.
 */
export async function writeAuditLog(input: {
  staff_id: string;
  applicant_id?: string | null;
  action_type: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  accreditation_id?: string | null;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("audit_log").insert(input as never);

  if (error) {
    throw new Error("Failed to write audit log");
  }
}

/**
 * Write an audit log entry for applicant self-service actions (e.g. document upload, profile update).
 * Uses staff_id = null to indicate a non-staff actor.
 */
export async function writeApplicantAuditLog(input: {
  applicant_id: string;
  action_type: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("audit_log").insert({
    staff_id: null,
    applicant_id: input.applicant_id,
    action_type: input.action_type,
    field_changed: input.field_changed,
    old_value: input.old_value,
    new_value: input.new_value,
  } as never);

  if (error) {
    // Non-critical — don't break the user's action if audit logging fails
    console.error("Failed to write applicant audit log:", error.message);
  }
}
