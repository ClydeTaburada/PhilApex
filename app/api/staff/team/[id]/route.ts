import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaffContext } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff } = await requireStaffContext();
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetId } = await params;
    const body = await req.json();

    const { full_name, role, password, is_active } = body;
    const supabase = getSupabaseAdminClient();

    // 1. Update Profile Fields
    const profileUpdates: any = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (role !== undefined) profileUpdates.role = role;
    if (is_active !== undefined) profileUpdates.is_active = is_active;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await (supabase as any)
        .from("staff")
        .update(profileUpdates)
        .eq("id", targetId);
      
      if (profileError) throw profileError;
    }

    // 2. Update Auth User (Password / Ban Status)
    const authUpdates: any = {};
    if (password) authUpdates.password = password;
    
    // If deactivating, ban them. If reactivating, lift the ban.
    if (is_active === false) {
      authUpdates.ban_duration = "876000h"; // ~100 years
    } else if (is_active === true) {
      authUpdates.ban_duration = "none";
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        targetId,
        authUpdates
      );
      if (authError) throw authError;
    }

    // 3. Audit Log
    const changes = Object.keys(profileUpdates).concat(password ? ["password"] : []).join(", ");
    if (changes) {
      await (supabase as any).from("audit_log").insert({
        staff_id: staff.id,
        applicant_id: null,
        action_type: "staff_updated",
        field_changed: changes,
        old_value: null,
        new_value: "updated",
      } as any);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
