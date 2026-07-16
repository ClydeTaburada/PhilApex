import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PartnerRow = {
  id: string;
  name: string;
  partner_type: string;
  is_final_employer: boolean;
  parent_partner_id: string | null;
  program_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  created_at: string;
  // joined fields
  parent_name?: string | null;
  program_name?: string | null;
  program_country?: string | null;
};

export type PartnerChainNode = {
  id: string;
  name: string;
  partner_type: string;
};

export async function getAllPartners(): Promise<PartnerRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("foreign_partners")
    .select(`
      id, name, partner_type, is_final_employer, parent_partner_id,
      program_id, contact_name, contact_phone, contact_email, contact_address, created_at,
      parent:foreign_partners!parent_partner_id(name),
      program:programs(name, country)
    `)
    .order("name", { ascending: true });

  if (error) throw new Error("Failed to load partners");

  return ((data ?? []) as any[]).map((row: any) => ({
    id: row.id,
    name: row.name,
    partner_type: row.partner_type,
    is_final_employer: row.is_final_employer,
    parent_partner_id: row.parent_partner_id,
    program_id: row.program_id,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    contact_address: row.contact_address,
    created_at: row.created_at,
    parent_name: Array.isArray(row.parent) ? row.parent[0]?.name ?? null : row.parent?.name ?? null,
    program_name: Array.isArray(row.program) ? row.program[0]?.name ?? null : row.program?.name ?? null,
    program_country: Array.isArray(row.program) ? row.program[0]?.country ?? null : row.program?.country ?? null,
  }));
}

export async function getPartnerById(id: string): Promise<PartnerRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("foreign_partners")
    .select(`
      id, name, partner_type, is_final_employer, parent_partner_id,
      program_id, contact_name, contact_phone, contact_email, contact_address, created_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to load partner");
  return data as PartnerRow | null;
}

/**
 * Walks the parent_partner_id chain recursively until a null parent is found.
 * Returns the chain from root → leaf (ancestor-first order).
 * Uses the in-memory flat list — no extra DB round-trips if you already have all partners.
 */
export function buildPartnerChain(
  partnerId: string,
  allPartners: PartnerRow[]
): PartnerChainNode[] {
  const map = new Map(allPartners.map((p) => [p.id, p]));
  const chain: PartnerChainNode[] = [];
  let current = map.get(partnerId);

  // Safety: cap at 20 hops to prevent infinite loops on bad data
  let hops = 0;
  while (current && hops < 20) {
    chain.unshift({ id: current.id, name: current.name, partner_type: current.partner_type });
    current = current.parent_partner_id ? map.get(current.parent_partner_id) : undefined;
    hops++;
  }
  return chain;
}

/**
 * Fetches a single partner AND builds its full ancestor chain from the DB.
 * Use this when you need chain display without having all partners in memory.
 */
export async function getPartnerWithChain(
  partnerId: string
): Promise<{ partner: PartnerRow; chain: PartnerChainNode[] } | null> {
  const allPartners = await getAllPartners();
  const partner = allPartners.find((p) => p.id === partnerId) ?? null;
  if (!partner) return null;
  const chain = buildPartnerChain(partnerId, allPartners);
  return { partner, chain };
}
