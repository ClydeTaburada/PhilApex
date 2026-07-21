import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireStaffContext } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff } = await requireStaffContext();

    // Only admin can regenerate employer access codes
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id: partnerId } = await params;

    const supabase = getSupabaseAdminClient();

    // Fetch old access code for audit log
    const { data: partner, error: fetchError } = await (supabase as any)
      .from("foreign_partners")
      .select("id, name, access_code, contact_email")
      .eq("id", partnerId)
      .single();

    if (fetchError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Generate a new random 6-character alphanumeric access code
    const newCode = Array.from(
      crypto.getRandomValues(new Uint8Array(4)),
      (b) => b.toString(36).padStart(2, "0")
    ).join("").slice(0, 6).toUpperCase();

    const { error: updateError } = await (supabase as any)
      .from("foreign_partners")
      .update({ access_code: newCode })
      .eq("id", partnerId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update access code" }, { status: 500 });
    }

    // Audit log
    await writeAuditLog({
      staff_id: staff.id,
      applicant_id: null,
      action_type: "employer_access_code_regenerated",
      field_changed: "access_code",
      old_value: partner.access_code,
      new_value: newCode,
    });

    return NextResponse.json({
      success: true,
      access_code: newCode,
      contact_email: partner.contact_email,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
