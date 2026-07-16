import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertJobOrderV2Schema } from "@/lib/schemas";
import { getAllJobOrdersV2 } from "@/lib/data/batches";

export async function GET() {
  try {
    await requireStaffContext();
    const jobOrders = await getAllJobOrdersV2();
    return NextResponse.json(jobOrders);
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
    const parsed = upsertJobOrderV2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { id: _id, ...insertData } = parsed.data;
    const { data, error } = await (supabase as any)
      .from("job_orders")
      .insert({
        ...insertData,
        // Default Phase 1 required fields for new Phase 2 records
        country: insertData.country ?? "",
        program_name: insertData.program_name ?? "",
        trade: insertData.trade ?? insertData.position,
        slots_total: insertData.manpower_requested,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
