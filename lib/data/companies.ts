import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getExpiryTier, type ExpiryTier } from "@/lib/data/accreditations";

export type CompanyListRow = {
  id: string;
  name: string;
  partner_type: string;
  country: string | null;
  program_name: string | null;
  parent_name: string | null;
  accreditation_status: string | null;
  accreditation_expiry_tier: ExpiryTier | null;
  slots_requested: number;
  total_hired: number;
  active_hired: number;
  balance: number;
};

export type CompanyDeploymentRow = {
  deployment_id: string;
  applicant_id: string;
  applicant_name: string;
  batch_id: string;
  batch_label: string;
  job_order_id: string;
  job_order_number: string | null;
  position: string | null;
  hired_date: string;
  entry_date: string | null;
  deployment_end_date: string | null;
  document_status: "on_process" | "dispatched";
  dispatched_date: string | null;
};

export async function getCompanyList(): Promise<CompanyListRow[]> {
  const supabase = getSupabaseAdminClient();

  // Get all final employers with their accreditations and job orders
  const { data: partners, error: pErr } = await (supabase as any)
    .from("foreign_partners")
    .select(`
      id, name, partner_type, parent_partner_id,
      program:programs!program_id(name, country),
      parent:foreign_partners!parent_partner_id(name),
      accreditation:accreditations!principal_partner_id(status, date_expiration),
      job_orders:job_orders!foreign_partner_id(id, manpower_requested)
    `)
    .eq("is_final_employer", true)
    .order("name", { ascending: true });

  if (pErr) throw new Error("Failed to load company list");

  // For each partner get deployment counts
  const results: CompanyListRow[] = [];
  for (const p of (partners ?? []) as any[]) {
    const acc = Array.isArray(p.accreditation) ? p.accreditation[0] : p.accreditation;
    const program = Array.isArray(p.program) ? p.program[0] : p.program;
    const parent = Array.isArray(p.parent) ? p.parent[0] : p.parent;
    const jos: any[] = Array.isArray(p.job_orders) ? p.job_orders : p.job_orders ? [p.job_orders] : [];

    const slotRequested = jos.reduce((sum: number, jo: any) => sum + (jo.manpower_requested ?? 0), 0);
    const joIds = jos.map((j: any) => j.id);

    let totalHired = 0;
    let activeHired = 0;
    if (joIds.length > 0) {
      const { count: total } = await (supabase as any)
        .from("deployments")
        .select("id, batch:batches!batch_id!inner(job_order_id)", { count: "exact", head: true })
        .in("batch.job_order_id", joIds);

      const { count: active } = await (supabase as any)
        .from("deployments")
        .select("id, batch:batches!batch_id!inner(job_order_id)", { count: "exact", head: true })
        .in("batch.job_order_id", joIds)
        .is("deployment_end_date", null);

      totalHired = total ?? 0;
      activeHired = active ?? 0;
    }

    results.push({
      id: p.id,
      name: p.name,
      partner_type: p.partner_type,
      country: program?.country ?? null,
      program_name: program?.name ?? null,
      parent_name: parent?.name ?? null,
      accreditation_status: acc?.status ?? null,
      accreditation_expiry_tier: acc ? getExpiryTier(acc.date_expiration) : null,
      slots_requested: slotRequested,
      total_hired: totalHired,
      active_hired: activeHired,
      balance: Math.max(0, slotRequested - totalHired),
    });
  }
  return results;
}

export async function getCompanyDetail(partnerId: string): Promise<CompanyDeploymentRow[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await (supabase as any)
    .from("deployments")
    .select(`
      id, applicant_id, batch_id, hired_date, entry_date, deployment_end_date,
      document_status, dispatched_date,
      applicant:applicants!applicant_id(full_name),
      batch:batches!batch_id(
        batch_label, job_order_id,
        job_order:job_orders!job_order_id(job_order_number, position, foreign_partner_id)
      )
    `)
    .order("hired_date", { ascending: false });

  if (error) throw new Error("Failed to load company detail");

  // Filter to this partner's job orders
  const rows = ((data ?? []) as any[]).filter((row: any) => {
    const jo = Array.isArray(row.batch)
      ? row.batch[0]?.job_order
      : row.batch?.job_order;
    const joData = Array.isArray(jo) ? jo[0] : jo;
    return joData?.foreign_partner_id === partnerId;
  });

  return rows.map((row: any) => {
    const batchData = Array.isArray(row.batch) ? row.batch[0] : row.batch;
    const joData = Array.isArray(batchData?.job_order) ? batchData?.job_order[0] : batchData?.job_order;
    return {
      deployment_id: row.id,
      applicant_id: row.applicant_id,
      applicant_name: Array.isArray(row.applicant) ? row.applicant[0]?.full_name ?? "" : row.applicant?.full_name ?? "",
      batch_id: row.batch_id,
      batch_label: batchData?.batch_label ?? "",
      job_order_id: batchData?.job_order_id ?? "",
      job_order_number: joData?.job_order_number ?? null,
      position: joData?.position ?? null,
      hired_date: row.hired_date,
      entry_date: row.entry_date,
      deployment_end_date: row.deployment_end_date,
      document_status: row.document_status,
      dispatched_date: row.dispatched_date,
    };
  }) as CompanyDeploymentRow[];
}
