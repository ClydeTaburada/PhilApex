import { NextResponse } from "next/server";
import { getEmployerSession } from "@/lib/employer-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const session = await getEmployerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await (supabase as any).from("employer_messages").insert({
      partner_id: session.partner_id,
      sender_type: "employer",
      content: content.trim(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Employer Send Message Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
