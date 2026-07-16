import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertAccreditationSchema } from "@/lib/schemas";
import { getAllAccreditations } from "@/lib/data/accreditations";

export async function GET() {
  try {
    await requireStaffContext();
    const accreditations = await getAllAccreditations();
    return NextResponse.json(accreditations);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = upsertAccreditationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { id: _id, ...insertData } = parsed.data;
    const { data, error } = await (supabase as any)
      .from("accreditations")
      .insert(insertData)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
