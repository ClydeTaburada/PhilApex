import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApplicantSession } from "@/lib/applicant-auth";

export async function POST(request: Request) {
  try {
    const session = await getApplicantSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;
    const file = formData.get("file") as File;

    if (!documentId || !file) {
      return NextResponse.json({ error: "Missing documentId or file" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Upload to applicant-documents bucket
    const ext = file.name.split(".").pop();
    const fileName = `${session.applicant_id}/${documentId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("applicant-documents")
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload file: " + uploadError.message }, { status: 500 });
    }

    // Update document status
    const { error: dbError } = await (supabase as any)
      .from("applicant_documents")
      .update({
        status: "submitted",
        file_path: fileName,
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId)
      .eq("applicant_id", session.applicant_id);

    if (dbError) {
      return NextResponse.json({ error: "Failed to update document record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, filePath: fileName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}