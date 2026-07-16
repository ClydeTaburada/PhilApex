import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DashboardFilterInput } from "@/lib/schemas";

export const APPLICANTS_PAGE_SIZE = 25;

type ApplicantListItem = {
  id: string;
  reference_number: string | null;
  full_name: string;
  cellphone_number: string;
  email: string | null;
  occupation_applied: string | null;
  source: "walk_in" | "job_fair" | "lgu_peso";
  has_passport: boolean;
  current_pipeline_stage:
    | "registered"
    | "documents_complete"
    | "dmw_registered"
    | "peos_certified"
    | "matched"
    | "deployed";
  created_at: string;
};

type ApplicantDocumentRow = {
  applicant_id: string;
};

async function getMissingDocumentApplicantIds(missingDocumentName: string): Promise<string[]> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("applicant_documents")
    .select("applicant_id, document_requirements!inner(doc_name)")
    .eq("status", "missing")
    .eq("document_requirements.doc_name", missingDocumentName);

  if (error || !data) {
    return [];
  }

  const rows = data as ApplicantDocumentRow[];
  const deduped = new Set(rows.map((row) => row.applicant_id));
  return Array.from(deduped);
}

export async function fetchApplicantsPage(filters: DashboardFilterInput): Promise<{
  rows: ApplicantListItem[];
  page: number;
  pageSize: number;
  total: number;
}> {
  const supabaseAdmin = getSupabaseAdminClient();
  const page = filters.page;
  const from = (page - 1) * APPLICANTS_PAGE_SIZE;
  const to = from + APPLICANTS_PAGE_SIZE - 1;

  const idsForMissingDoc = filters.missing_document
    ? await getMissingDocumentApplicantIds(filters.missing_document)
    : null;

  let query = supabaseAdmin.from("applicants").select(
    "id, reference_number, full_name, cellphone_number, email, occupation_applied, source, has_passport, current_pipeline_stage, created_at",
    {
      count: "exact",
    },
  );

  if (filters.pipeline_stage) {
    query = query.eq("current_pipeline_stage", filters.pipeline_stage);
  }
  if (filters.occupation_applied) {
    query = query.ilike("occupation_applied", `%${filters.occupation_applied}%`);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }
  if (typeof filters.has_passport === "boolean") {
    query = query.eq("has_passport", filters.has_passport);
  }
  if (filters.date_from) {
    query = query.gte("created_at", `${filters.date_from}T00:00:00.000Z`);
  }
  if (filters.date_to) {
    query = query.lte("created_at", `${filters.date_to}T23:59:59.999Z`);
  }
  if (filters.search) {
    query = query.ilike("full_name", `%${filters.search}%`);
  }
  if (idsForMissingDoc) {
    query = query.in(
      "id",
      idsForMissingDoc.length > 0 ? idsForMissingDoc : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error("Failed to load applicant list");
  }

  return {
    rows: (data ?? []) as ApplicantListItem[],
    page,
    pageSize: APPLICANTS_PAGE_SIZE,
    total: count ?? 0,
  };
}

export async function fetchApplicantsForCsv(filters: DashboardFilterInput): Promise<ApplicantListItem[]> {
  const supabaseAdmin = getSupabaseAdminClient();
  const idsForMissingDoc = filters.missing_document
    ? await getMissingDocumentApplicantIds(filters.missing_document)
    : null;

  let query = supabaseAdmin
    .from("applicants")
    .select(
      "id, full_name, cellphone_number, email, occupation_applied, source, has_passport, current_pipeline_stage, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(10000);

  if (filters.pipeline_stage) {
    query = query.eq("current_pipeline_stage", filters.pipeline_stage);
  }
  if (filters.occupation_applied) {
    query = query.ilike("occupation_applied", `%${filters.occupation_applied}%`);
  }
  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }
  if (typeof filters.has_passport === "boolean") {
    query = query.eq("has_passport", filters.has_passport);
  }
  if (filters.date_from) {
    query = query.gte("created_at", `${filters.date_from}T00:00:00.000Z`);
  }
  if (filters.date_to) {
    query = query.lte("created_at", `${filters.date_to}T23:59:59.999Z`);
  }
  if (filters.search) {
    query = query.ilike("full_name", `%${filters.search}%`);
  }
  if (idsForMissingDoc) {
    query = query.in(
      "id",
      idsForMissingDoc.length > 0 ? idsForMissingDoc : ["00000000-0000-0000-0000-000000000000"],
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to export applicants");
  }

  return (data ?? []) as ApplicantListItem[];
}
