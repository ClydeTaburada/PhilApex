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
    const { id: _id, positions, ...insertData } = parsed.data;
    
    // First, insert or update the job order
    const { data: joData, error: joError } = await (supabase as any)
      .from("job_orders")
      .upsert({
        ...(_id ? { id: _id } : {}),
        ...insertData,
        // Default Phase 1 required fields for new Phase 2 records
        country: insertData.country ?? "",
        program_name: insertData.program_name ?? "",
        trade: insertData.trade ?? (positions && positions.length > 0 ? positions[0].position : ""),
      })
      .select()
      .single();
      
    if (joError) return NextResponse.json({ error: joError.message }, { status: 500 });
    
    // Now handle positions
    // If updating, delete old positions first (simple approach) or upsert based on ID
    if (_id) {
       await (supabase as any)
        .from("job_order_positions")
        .delete()
        .eq("job_order_id", joData.id);
    }
    
    const positionsData = positions.map((p: any) => ({
      job_order_id: joData.id,
      position: p.position,
      position_code: p.position_code || null,
      needed: p.needed,
      salary_amount: p.salary_amount || null,
      salary_currency: p.salary_currency || null,
      salary_period: p.salary_period || null,
      wage_type: p.wage_type || null
    }));
    
    const { error: posError } = await (supabase as any)
      .from("job_order_positions")
      .insert(positionsData);
      
    if (posError) return NextResponse.json({ error: posError.message }, { status: 500 });

    return NextResponse.json(joData, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
