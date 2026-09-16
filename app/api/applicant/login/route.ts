import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptApplicantSession } from "@/lib/applicant-auth";
import { cookies } from "next/headers";

function normalizeDob(rawDob: string): string | null {
  if (!rawDob) return null;
  const trimmed = rawDob.trim();

  // If YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // If ISO string with T (e.g. 1988-08-23T00:00:00.000Z)
  if (trimmed.includes("T")) {
    return trimmed.split("T")[0];
  }

  // If contains slashes or dashes (e.g. MM/DD/YYYY, DD/MM/YYYY, or YYYY/MM/DD)
  const sep = trimmed.includes("/") ? "/" : trimmed.includes("-") ? "-" : null;
  if (sep) {
    const parts = trimmed.split(sep);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      } else if (parts[2].length === 4) {
        const year = parts[2];
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);

        if (p1 > 12 && p2 <= 12) {
          // DD/MM/YYYY
          return `${year}-${String(p2).padStart(2, "0")}-${String(p1).padStart(2, "0")}`;
        }
        if (p2 > 12 && p1 <= 12) {
          // MM/DD/YYYY
          return `${year}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
        }
        return `${year}-${String(p1).padStart(2, "0")}-${String(p2).padStart(2, "0")}`;
      }
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return trimmed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference_number, date_of_birth } = body;

    if (!reference_number || !date_of_birth) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const cleanRef = String(reference_number).trim();
    const cleanDob = String(date_of_birth).trim();

    if (!cleanRef || !cleanDob) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // ── Rate Limiting ─────────────────────────────────────────
    const headerStore = await headers();
    const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
      || headerStore.get("x-real-ip")
      || "unknown";

    try {
      const { data: allowed, error: rlError } = await (supabase as any).rpc(
        "check_portal_login_rate_limit",
        { p_ip: clientIp, p_portal_type: "applicant" }
      );

      if (!rlError && allowed === false) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again in 15 minutes." },
          { status: 429 }
        );
      }
    } catch (rlEx) {
      console.warn("Rate limit check ignored due to exception:", rlEx);
    }

    // ── Credential Check ──────────────────────────────────────
    // Accept either formatted reference_number (e.g. 2026-0002-A, case-insensitive) OR UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRef);
    const normalizedDob = normalizeDob(cleanDob);

    let query = (supabase as any)
      .from("applicants")
      .select("id, reference_number, full_name, date_of_birth");

    if (isUuid) {
      query = query.eq("id", cleanRef);
    } else {
      query = query.ilike("reference_number", cleanRef);
    }

    const { data: applicant, error: queryError } = await query.maybeSingle();

    if (queryError || !applicant) {
      return NextResponse.json({ error: "Invalid Reference Number or Date of Birth" }, { status: 401 });
    }

    // Verify Date of Birth matching
    const dbDob = String(applicant.date_of_birth || "").split("T")[0];
    let dobMatches = false;

    if (dbDob === cleanDob || (normalizedDob && dbDob === normalizedDob)) {
      dobMatches = true;
    } else {
      // Check alternative date format interpretations (e.g. DD/MM vs MM/DD)
      const sep = cleanDob.includes("/") ? "/" : cleanDob.includes("-") ? "-" : null;
      if (sep) {
        const parts = cleanDob.split(sep);
        if (parts.length === 3 && parts[2].length === 4) {
          const alt1 = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
          const alt2 = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          if (dbDob === alt1 || dbDob === alt2) {
            dobMatches = true;
          }
        }
      }
    }

    if (!dobMatches) {
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