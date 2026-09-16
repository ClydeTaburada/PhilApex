import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type DocumentRequirementRow = {
  id: number;
  doc_name: string;
  requires_file_upload: boolean;
  is_conditional: boolean;
  condition_note: string | null;
};

export async function getAllDocumentRequirements(): Promise<DocumentRequirementRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("document_requirements")
    .select("id, doc_name, requires_file_upload, is_conditional, condition_note")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching document requirements:", error);
    return [];
  }

  return (data ?? []) as DocumentRequirementRow[];
}
