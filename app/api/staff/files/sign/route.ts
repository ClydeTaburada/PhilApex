import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  path: z.string().min(3).max(300),
});

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    await requireStaffApiContext();

    const parsed = querySchema.safeParse({
      path: new URL(request.url).searchParams.get("path"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const filePath = parsed.data.path;
    if (filePath.startsWith("/") || filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from("applicant-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Unable to create signed URL" }, { status: 500 });
    }

    return NextResponse.json({ data: { signedUrl: data.signedUrl } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
