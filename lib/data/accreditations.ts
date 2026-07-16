import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ExpiryTier = "ok" | "warn_60" | "warn_30" | "expired";

export type AccreditationRow = {
  id: string;
  accreditation_id_dmw: string;
  principal_partner_id: string;
  partner_name?: string;
  processing_unit: string | null;
  representative: string | null;
  date_issued: string;
  date_expiration: string;
  status: "active" | "renewed" | "expired_unconfirmed";
  created_at: string;
  updated_at: string;
  expiry_tier: ExpiryTier;
};

export type AccreditationHistoryRow = {
  id: string;
  accreditation_id: string;
  old_date_issued: string;
  old_date_expiration: string;
  changed_at: string;
};

/** Returns an expiry tier based on days remaining to date_expiration. */
export function getExpiryTier(dateExpiration: string): ExpiryTier {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateExpiration);
  const daysRemaining = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);

  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 30) return "warn_30";
  if (daysRemaining <= 60) return "warn_60";
  return "ok";
}

export async function getAllAccreditations(): Promise<AccreditationRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("accreditations")
    .select(`
      id, accreditation_id_dmw, principal_partner_id, processing_unit, representative,
      date_issued, date_expiration, status, created_at, updated_at,
      partner:foreign_partners!principal_partner_id(name)
    `)
    .order("date_expiration", { ascending: true });

  if (error) throw new Error("Failed to load accreditations");

  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    partner_name: Array.isArray(row.partner) ? row.partner[0]?.name ?? null : row.partner?.name ?? null,
    expiry_tier: getExpiryTier(row.date_expiration),
  })) as AccreditationRow[];
}

export async function getAccreditationById(id: string): Promise<AccreditationRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("accreditations")
    .select(`
      id, accreditation_id_dmw, principal_partner_id, processing_unit, representative,
      date_issued, date_expiration, status, created_at, updated_at,
      partner:foreign_partners!principal_partner_id(name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load accreditation");
  if (!data) return null;

  return {
    ...(data as any),
    partner_name: Array.isArray((data as any).partner)
      ? (data as any).partner[0]?.name ?? null
      : (data as any).partner?.name ?? null,
    expiry_tier: getExpiryTier((data as any).date_expiration),
  } as AccreditationRow;
}

export async function getAccreditationHistory(
  accreditationId: string
): Promise<AccreditationHistoryRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("accreditation_history")
    .select("id, accreditation_id, old_date_issued, old_date_expiration, changed_at")
    .eq("accreditation_id", accreditationId)
    .order("changed_at", { ascending: false });

  if (error) throw new Error("Failed to load accreditation history");
  return (data ?? []) as AccreditationHistoryRow[];
}
