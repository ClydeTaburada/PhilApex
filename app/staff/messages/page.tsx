import { redirect } from "next/navigation";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { StaffShell } from "@/components/staff-shell";
import { MessagesManager } from "./messages-manager";

export const dynamic = "force-dynamic";

export default async function StaffMessagesPage() {
  const context = await requireStaffContext();
  const supabase = getSupabaseAdminClient();

  // Fetch all applicants for the sidebar
  const { data: applicants } = await (supabase as any)
    .from("applicants")
    .select("id, full_name, email")
    .order("created_at", { ascending: false });

  // Fetch all employers for the sidebar
  const { data: employers } = await (supabase as any)
    .from("foreign_partners")
    .select("id, name, contact_email")
    .order("created_at", { ascending: false });

  return (
    <StaffShell
      active="messages"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Messages"
      subtitle="Chat with applicants and employers"
    >
      <MessagesManager 
        applicants={applicants || []} 
        employers={employers || []} 
        staffId={context.staff.id} 
      />
    </StaffShell>
  );
}
