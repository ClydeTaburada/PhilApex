import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ApplicantDetail = {
  id: string;
  reference_number: string | null;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
  home_address: string | null;
  cellphone_number: string;
  email: string | null;
  educational_attainment: string | null;
  occupation_applied: string | null;
  has_passport: boolean;
  source: "walk_in" | "job_fair" | "lgu_peso";
  dmw_registration_number: string | null;
  peos_modules_completed: number;
  peos_certificate_status: "not_started" | "in_progress" | "completed";
  current_pipeline_stage:
    | "registered"
    | "documents_complete"
    | "dmw_registered"
    | "peos_certified"
    | "matched"
    | "deployed";
  assigned_job_order_id: string | null;
  created_at: string;
};

export type ApplicantDocumentDetail = {
  id: string;
  status: "missing" | "submitted" | "verified";
  file_path: string | null;
  document_requirement: {
    id: number;
    doc_name: string;
    requires_file_upload: boolean;
    is_conditional: boolean;
    condition_note: string | null;
  };
};

export async function fetchApplicantDetail(applicantId: string): Promise<{
  applicant: ApplicantDetail;
  documents: ApplicantDocumentDetail[];
}> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: applicant, error: applicantError } = await supabaseAdmin
    .from("applicants")
    .select(
      "id, reference_number, full_name, date_of_birth, gender, home_address, cellphone_number, email, educational_attainment, occupation_applied, has_passport, source, dmw_registration_number, peos_modules_completed, peos_certificate_status, current_pipeline_stage, created_at",
    )
    .eq("id", applicantId)
    .maybeSingle();

  if (applicantError || !applicant) {
    throw new Error("Applicant not found");
  }

  const { data: documents, error: documentsError } = await supabaseAdmin
    .from("applicant_documents")
    .select(
      "id, status, file_path, document_requirement:document_requirements!inner(id, doc_name, requires_file_upload, is_conditional, condition_note)",
    )
    .eq("applicant_id", applicantId)
    .order("document_requirement_id", { ascending: true });

  if (documentsError) {
    throw new Error("Failed to load applicant documents");
  }

  const rawDocuments = (documents ?? []) as Array<{
    id: string;
    status: "missing" | "submitted" | "verified";
    file_path: string | null;
    document_requirement:
      | {
          id: number;
          doc_name: string;
          requires_file_upload: boolean;
          is_conditional: boolean;
          condition_note: string | null;
        }
      | Array<{
          id: number;
          doc_name: string;
          requires_file_upload: boolean;
          is_conditional: boolean;
          condition_note: string | null;
        }>;
  }>;

  const normalizedDocuments: ApplicantDocumentDetail[] = rawDocuments.map((doc) => {
    const relation = Array.isArray(doc.document_requirement)
      ? doc.document_requirement[0]
      : doc.document_requirement;

    return {
      id: doc.id,
      status: doc.status,
      file_path: doc.file_path,
      document_requirement: {
        id: relation.id,
        doc_name: relation.doc_name,
        requires_file_upload: relation.requires_file_upload,
        is_conditional: relation.is_conditional,
        condition_note: relation.condition_note,
      },
    };
  });

  const { data: aj } = await supabaseAdmin
    .from("applicant_job_orders")
    .select("job_order_id")
    .eq("applicant_id", applicantId)
    .maybeSingle();

  return {
    applicant: {
      ...(applicant as any),
      assigned_job_order_id: (aj as any)?.job_order_id ?? null,
    } as ApplicantDetail,
    documents: normalizedDocuments,
  };
}
