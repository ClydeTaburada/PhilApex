import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getExpiryTier, type ExpiryTier } from "@/lib/data/accreditations";

export type BatchRow = {
  id: string;
  job_order_id: string;
  batch_label: string;
  created_at: string;
};

export type DeploymentRow = {
  id: string;
  applicant_id: string;
  applicant_name?: string;
  batch_id: string;
  hired_date: string;
  entry_date: string | null;
  deployment_end_date: string | null;
  document_status: "on_process" | "dispatched";
  dispatched_date: string | null;
  visa_status: "pending" | "approved" | "denied";
  oec_number: string | null;
  flight_airline: string | null;
  flight_number: string | null;
  departure_datetime: string | null;
  created_at: string;
  updated_at: string;
};

export type JobOrderV2Row = {
  id: string;
  job_order_number: string | null;
  accreditation_id: string | null;
  foreign_partner_id: string | null;
  position: string | null;
  class: "direct" | "additional" | null;
  manpower_requested: number | null;
  jo_validity_date: string | null;
  // Phase 1 legacy fields
  country: string | null;
  program_name: string | null;
  trade: string | null;
  gender_requirement: string | null;
  slots_total: number;
  slots_filled: number;
  status: string;
  created_at: string;
  // computed
  no_hired?: number;
  jo_balance?: number;
  accreditation_expiry_tier?: ExpiryTier;
  jo_validity_tier?: ExpiryTier;
};

export async function getBatchesByJobOrder(jobOrderId: string): Promise<BatchRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("batches")
    .select("id, job_order_id, batch_label, created_at")
    .eq("job_order_id", jobOrderId)
    .order("batch_label", { ascending: true });

  if (error) throw new Error("Failed to load batches");
  return (data ?? []) as BatchRow[];
}

export async function getDeploymentsByBatch(batchId: string): Promise<DeploymentRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("deployments")
    .select(`
      id, applicant_id, batch_id, hired_date, entry_date, deployment_end_date,
      document_status, dispatched_date, visa_status, oec_number, flight_airline, flight_number, departure_datetime, created_at, updated_at,
      applicants(full_name)
    `)
    .eq("batch_id", batchId)
    .order("hired_date", { ascending: false });

  if (error) throw new Error("Failed to load deployments");

  return ((data ?? []) as any[]).map((row: any) => ({
    ...row,
    applicant_name: Array.isArray(row.applicants)
      ? row.applicants[0]?.full_name ?? null
      : row.applicants?.full_name ?? null,
  })) as DeploymentRow[];
}

/** Computes no_hired (active deployments) and jo_balance for a job order. */
export async function getDeploymentCounts(jobOrderId: string): Promise<{
  no_hired: number;
  jo_balance: number;
  manpower_requested: number;
}> {
  const supabase = getSupabaseAdminClient();

  // no_hired = deployed applicants not yet ended (deployment_end_date is null)
  const { count: activeCount, error: activeErr } = await (supabase as any)
    .from("deployments")
    .select("id, batch:batches!batch_id!inner(job_order_id)", { count: "exact", head: true })
    .eq("batch.job_order_id", jobOrderId)
    .is("deployment_end_date", null);

  if (activeErr) throw new Error("Failed to count deployments");

  // total hired (any status)
  const { count: totalCount, error: totalErr } = await (supabase as any)
    .from("deployments")
    .select("id, batch:batches!batch_id!inner(job_order_id)", { count: "exact", head: true })
    .eq("batch.job_order_id", jobOrderId);

  if (totalErr) throw new Error("Failed to count total deployments");

  // get manpower_requested
  const { data: jo, error: joErr } = await (supabase as any)
    .from("job_orders")
    .select("manpower_requested")
    .eq("id", jobOrderId)
    .maybeSingle();

  if (joErr) throw new Error("Failed to load job order");
  const manpower = (jo as any)?.manpower_requested ?? 0;

  const hired = totalCount ?? 0;
  return {
    no_hired: hired,
    jo_balance: Math.max(0, manpower - hired),
    manpower_requested: manpower,
  };
}

export async function getAllJobOrdersV2(): Promise<JobOrderV2Row[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("job_orders")
    .select(`
      id, job_order_number, accreditation_id, foreign_partner_id, position, class,
      manpower_requested, jo_validity_date, country, program_name, trade,
      gender_requirement, slots_total, slots_filled, status, created_at,
      accreditation:accreditations!accreditation_id(date_expiration)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load job orders");

  return ((data ?? []) as any[]).map((row: any) => {
    const accExp = Array.isArray(row.accreditation)
      ? row.accreditation[0]?.date_expiration
      : row.accreditation?.date_expiration;
    return {
      ...row,
      accreditation_expiry_tier: accExp ? getExpiryTier(accExp) : undefined,
      jo_validity_tier: row.jo_validity_date ? getExpiryTier(row.jo_validity_date) : undefined,
    };
  }) as JobOrderV2Row[];
}

export async function getContractEndAlerts(): Promise<DeploymentRow[]> {
  const supabase = getSupabaseAdminClient();
  // Find deployments where entry_date is set, end not set, and program duration is known
  // We compute the alert in app layer since there's no formula column
  const { data, error } = await (supabase as any)
    .from("deployments")
    .select(`
      id, applicant_id, batch_id, hired_date, entry_date, deployment_end_date,
      document_status, dispatched_date, created_at, updated_at,
      applicant:applicants!applicant_id(full_name),
      batch:batches!batch_id(
        job_order_id,
        job_order:job_orders!job_order_id(
          foreign_partner_id,
          partner:foreign_partners!foreign_partner_id(
            program_id,
            program:programs!program_id(standard_duration_years)
          )
        )
      )
    `)
    .is("deployment_end_date", null)
    .not("entry_date", "is", null);

  if (error) {
    throw new Error(`Failed to load deployments for alerts: ${error.message}`);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alertWindowMs = 90 * 86_400_000;

  return ((data ?? []) as any[])
    .filter((row: any) => {
      const entryDate = new Date(row.entry_date);
      const program = Array.isArray(row.batch)
        ? row.batch[0]?.job_order?.[0]?.partner?.[0]?.program?.[0]
        : row.batch?.job_order?.partner?.program;
      const durationYears = program?.standard_duration_years;
      if (!durationYears) return false;
      const contractEnd = new Date(entryDate);
      contractEnd.setFullYear(contractEnd.getFullYear() + durationYears);
      const msToEnd = contractEnd.getTime() - today.getTime();
      return msToEnd >= 0 && msToEnd <= alertWindowMs;
    })
    .map((row: any) => ({
      ...row,
      applicant_name: Array.isArray(row.applicant)
        ? row.applicant[0]?.full_name ?? null
        : row.applicant?.full_name ?? null,
    })) as DeploymentRow[];
}
