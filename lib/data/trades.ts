import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type TradeRow = {
  id: string;
  name: string;
  created_at: string;
};

export async function getAllTrades(): Promise<TradeRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("trades")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching trades:", error);
    return [];
  }
  return data as TradeRow[];
}
