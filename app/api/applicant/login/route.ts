import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptApplicantSession } from "@/lib/applicant-auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { reference_number, date_of_birth } = await request.json();

    if (!reference_number || !date_of_birth) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // ── Rate Limiting ─────────────────────────────────────────
    const headerStore = await headers();
    const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headerStore.get("x-real-ip")
      || "unknown";

    const { data: allowed, error: rlError } = await (supabase as any).rpc(
      "check_portal_login_rate_limit",
      { p_ip: clientIp, p_portal_type: "applicant" }
    );

    if (rlError) {
      console.error("Rate limit check error:", rlError);
      // If the function doesn't exist (e.g. migration not run), allow the login to proceed.
      // We only block if the RPC explicitly returned allowed === false.
    }

    if (allowed === false) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // ── Credential Check ──────────────────────────────────────
    const { data: applicant, error } = await (supabase as any)
      .from("applicants")
      .select("id, reference_number, full_name, date_of_birth")
      .eq("reference_number", reference_number)
      .eq("date_of_birth", date_of_birth)
      .maybeSingle();

    if (error || !applicant) {
      return NextResponse.json({ error: "Invalid Reference Number or Date of Birth" }, { status: 401 });
    }

    // Create session
    const sessionToken = await encryptApplicantSession({
      applicant_id: applicant.id,
      reference_number: applicant.reference_number,
      full_name: applicant.full_name,
    });

    const cookieStore = await cookies();
    cookieStore.set("applicant_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}