import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApplicantSession } from "@/lib/applicant-auth";
import { writeApplicantAuditLog } from "@/lib/audit";
import { ALLOWED_DOC_MIME_TYPES, MAX_DOC_FILE_SIZE } from "@/lib/schemas";

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

    // ── Zod-aligned file validation ───────────────────────────
    if (!(ALLOWED_DOC_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: JPEG, PNG, PDF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOC_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // ── Verify document belongs to this applicant ─────────────
    const { data: docRecord, error: docCheckError } = await (supabase as any)
      .from("applicant_documents")
      .select("id, status, document_requirement:document_requirements(doc_name)")
      .eq("id", documentId)
      .eq("applicant_id", session.applicant_id)
      .maybeSingle();

    if (docCheckError || !docRecord) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
    }

    // Applicants can only upload for "missing" or "submitted" documents — never "verified"
    if (docRecord.status === "verified") {
      return NextResponse.json(
        { error: "This document has already been verified and cannot be replaced." },
        { status: 400 }
      );
    }

    // ── Upload to storage ─────────────────────────────────────
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

    // ── Update document status ────────────────────────────────
    const oldStatus = docRecord.status;
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

    // ── Audit log ─────────────────────────────────────────────
    const docName = Array.isArray(docRecord.document_requirement)
      ? docRecord.document_requirement[0]?.doc_name
      : docRecord.document_requirement?.doc_name;

    await writeApplicantAuditLog({
      applicant_id: session.applicant_id,
      action_type: "applicant_document_upload",
      field_changed: docName || "document",
      old_value: oldStatus,
      new_value: "submitted",
    });

    return NextResponse.json({ success: true, filePath: fileName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}