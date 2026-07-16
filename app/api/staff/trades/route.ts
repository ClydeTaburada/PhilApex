import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createTradeSchema = z.object({
  name: z.string().trim().min(2).max(255),
});

export async function POST(req: NextRequest) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createTradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("trades")
      .insert({ name: parsed.data.name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "Trade already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
