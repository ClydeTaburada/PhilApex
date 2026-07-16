import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function writeAuditLog(input: {
  staff_id: string;
  applicant_id: string;
  action_type: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
}): Promise<void> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("audit_log").insert(input as never);

  if (error) {
    throw new Error("Failed to write audit log");
  }
}
