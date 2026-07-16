import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertBatchSchema } from "@/lib/schemas";
import { getBatchesByJobOrder } from "@/lib/data/batches";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffContext();
    const { id } = await params;
    const batches = await getBatchesByJobOrder(id);
    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: jobOrderId } = await params;
    const body = await req.json();
    const parsed = upsertBatchSchema.safeParse({ ...body, job_order_id: jobOrderId });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("batches")
      .insert({ batch_label: parsed.data.batch_label, job_order_id: jobOrderId })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
