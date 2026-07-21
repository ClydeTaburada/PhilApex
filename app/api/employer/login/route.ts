import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createEmployerSession } from "@/lib/employer-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, access_code } = await req.json();

    if (!email || !access_code) {
      return NextResponse.json({ error: "Email and Access Code are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // ── Rate Limiting ─────────────────────────────────────────
    const headerStore = await headers();
    const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headerStore.get("x-real-ip")
      || "unknown";

    const { data: allowed, error: rlError } = await (supabase as any).rpc(
      "check_portal_login_rate_limit",
      { p_ip: clientIp, p_portal_type: "employer" }
    );

    if (rlError || allowed === false) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // ── Credential Check ──────────────────────────────────────
    const { data: partner, error } = await (supabase as any)
      .from("foreign_partners")
      .select("id, name")
      .eq("contact_email", email)
      .eq("access_code", access_code)
      .single();

    if (error || !partner) {
      return NextResponse.json({ error: "Invalid email or access code." }, { status: 401 });
    }

    // Create session
    await createEmployerSession({
      partner_id: partner.id,
      partner_name: partner.name,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error during login." }, { status: 500 });
  }
}
