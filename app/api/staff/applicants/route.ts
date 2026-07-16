import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    await requireStaffContext();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const supabase = getSupabaseAdminClient();

    let query = (supabase as any)
      .from("applicants")
      .select("id, full_name, occupation_applied")
      .order("full_name", { ascending: true })
      .limit(100);

    if (q.trim()) {
      query = query.ilike("full_name", `%${q}%`);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json((data ?? []) as Array<{ id: string; full_name: string; occupation_applied: string | null }>);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
