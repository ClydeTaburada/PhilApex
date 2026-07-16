import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { renewAccreditationSchema } from "@/lib/schemas";

/**
 * POST /api/staff/accreditations/[id]/renew
 * Renews an accreditation:
 * - Saves old dates to accreditation_history
 * - Updates the accreditation with new dates and status = 'renewed'
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = renewAccreditationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Fetch current record to preserve old dates
    const { data: current, error: fetchErr } = await (supabase as any)
      .from("accreditations")
      .select("date_issued, date_expiration")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !current) {
      return NextResponse.json({ error: "Accreditation not found" }, { status: 404 });
    }

    // Insert history row
    const { error: histErr } = await (supabase as any)
      .from("accreditation_history")
      .insert({
        accreditation_id: id,
        old_date_issued: (current as any).date_issued,
        old_date_expiration: (current as any).date_expiration,
        changed_by: context.staff.id,
      });

    if (histErr) {
      return NextResponse.json({ error: "Failed to save renewal history" }, { status: 500 });
    }

    // Update accreditation with new dates + status = renewed
    const { data: updated, error: updateErr } = await (supabase as any)
      .from("accreditations")
      .update({
        date_issued: parsed.data.date_issued,
        date_expiration: parsed.data.date_expiration,
        status: "renewed",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
