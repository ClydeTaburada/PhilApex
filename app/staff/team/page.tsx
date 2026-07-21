import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { TeamManager } from "./team-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const context = await requireStaffContext();
  
  // Only admins can access this page
  if (context.staff.role !== "admin") {
    return notFound();
  }

  const supabase = getSupabaseAdminClient();

  // Fetch auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;

  // Fetch staff profiles
  const { data: profiles, error: profileError } = await supabase
    .from("staff")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });
  
  if (profileError) throw profileError;

  const authUsersMap = new Map(authData.users.map((u) => [u.id, u]));

  const team = (profiles || []).map((p: any) => {
    const authUser = authUsersMap.get(p.id);
    return {
      id: p.id,
      email: authUser?.email || "",
      full_name: p.full_name,
      role: p.role,
      is_active: p.is_active,
      created_at: p.created_at,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    };
  });

  return (
    <StaffShell
      active="team"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Team Management"
      subtitle="Manage internal staff accounts, roles, and access"
    >
      <TeamManager initialTeam={team} currentUserId={context.staff.id} />
    </StaffShell>
  );
}
