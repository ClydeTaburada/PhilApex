import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { updateDocumentStatusSchema } from "@/lib/schemas";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const { id, documentId } = await context.params;
    const { supabase, staff } = await requireStaffApiContext();

    const payload = await request.json();
    const parsed = updateDocumentStatusSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid document payload" }, { status: 400 });
    }

    if (parsed.data.status === "verified" && staff.role === "front_desk") {
      return NextResponse.json(
        {
          error: "front_desk cannot mark a document as verified",
        },
        { status: 403 },
      );
    }

    const { data: currentDocument, error: loadError } = await supabase
      .from("applicant_documents")
      .select("id, applicant_id, status")
      .eq("id", documentId)
      .eq("applicant_id", id)
      .maybeSingle();

    if (loadError || !currentDocument) {
      return NextResponse.json({ error: "Document row not found" }, { status: 404 });
    }

    const oldValue = currentDocument.status;
    const newValue = parsed.data.status;

    const { error: updateError } = await supabase
      .from("applicant_documents")
      .update({ status: newValue, updated_by: staff.id })
      .eq("id", documentId)
      .eq("applicant_id", id);

    if (updateError) {
      return NextResponse.json({ error: "Unable to update document status" }, { status: 500 });
    }

    await writeAuditLog({
      staff_id: staff.id,
      applicant_id: id,
      action_type: "document_update",
      field_changed: `document_status:${documentId}`,
      old_value: oldValue,
      new_value: newValue,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
