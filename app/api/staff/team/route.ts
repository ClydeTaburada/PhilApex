import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaffContext } from "@/lib/auth";

export async function GET() {
  try {
    const { staff } = await requireStaffContext();
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // Fetch staff profiles
    const { data: profiles, error: profileError } = await (supabase as any)
      .from("staff")
      .select("id, full_name, role, is_active, created_at");
    
    if (profileError) throw profileError;

    const authUsersMap = new Map(authData.users.map((u) => [u.id, u]));

    const team = (profiles || []).map((p: any) => {
      const authUser = authUsersMap.get(p.id);
      return {
        id: p.id,
        email: authUser?.email || null,
        full_name: p.full_name,
        role: p.role,
        is_active: p.is_active,
        created_at: p.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
      };
    });

    return NextResponse.json({ team });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { staff } = await requireStaffContext();
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create staff profile
    const { error: profileError } = await (supabase as any)
      .from("staff")
      .insert({
        id: userId,
        full_name,
        role,
        is_active: true,
      });

    if (profileError) {
      // Rollback if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to create staff profile" }, { status: 500 });
    }

    // 3. Audit Log
    await (supabase as any).from("audit_log").insert({
      staff_id: staff.id,
      applicant_id: null,
      action_type: "staff_created",
      field_changed: "account",
      old_value: null,
      new_value: email,
    } as any);

    return NextResponse.json({ success: true, id: userId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
