import { NextResponse } from "next/server";
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
    
    // Fetch applicant matching ref number and DOB
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