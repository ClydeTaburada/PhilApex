import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ProgramRow = {
  id: string;
  name: string;
  country: string;
  standard_duration_years: number | null;
  created_at: string;
};

export async function getAllPrograms(): Promise<ProgramRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("programs")
    .select("id, name, country, standard_duration_years, created_at")
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("Failed to load programs");
  return (data ?? []) as ProgramRow[];
}

export async function getProgramById(id: string): Promise<ProgramRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("programs")
    .select("id, name, country, standard_duration_years, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load program");
  return data as ProgramRow | null;
}
