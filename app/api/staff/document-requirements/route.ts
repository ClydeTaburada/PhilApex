import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllDocumentRequirements } from "@/lib/data/document-requirements";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRequirementSchema = z.object({
  doc_name: z.string().trim().min(2).max(255),
  requires_file_upload: z.boolean().default(false),
  is_conditional: z.boolean().default(false),
  condition_note: z.string().trim().nullable().optional(),
});

export async function GET() {
  try {
    await requireStaffContext();
    const requirements = await getAllDocumentRequirements();
    return NextResponse.json(requirements, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await requireStaffContext();
    if (!["processing_officer", "admin"].includes(context.staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createRequirementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data, error } = await (supabase as any)
      .from("document_requirements")
      .insert({
        doc_name: parsed.data.doc_name,
        requires_file_upload: parsed.data.requires_file_upload,
        is_conditional: parsed.data.is_conditional,
        condition_note: parsed.data.condition_note || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Document requirement already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
