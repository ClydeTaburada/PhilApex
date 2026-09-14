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

export type JobOrderPositionRow = {
  id: string;
  position: string;
  position_code: string | null;
  needed: number;
  processed: number;
  salary_amount: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  wage_type: string | null;
};

export type JobOrderV2Row = {
  id: string;
  job_order_number: string | null;
  accreditation_id: string | null;
  foreign_partner_id: string | null;
  class: string | null;
  date_approved: string | null;
  valid_until: string | null;
  status_text: string | null;
  category: string | null;
  reference_number: string | null;
  parent_job_order_id: string | null;
  // Phase 1 legacy fields
  country: string | null;
  program_name: string | null;
  trade: string | null;
  gender_requirement: string | null;
  status: string;
  created_at: string;
  positions: JobOrderPositionRow[];
  
  // computed
  no_hired?: number;
  jo_balance?: number;
  manpower_requested?: number;
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

  // get positions to calculate total manpower requested and balance
  const { data: positions, error: posErr } = await (supabase as any)
    .from("job_order_positions")
    .select("needed, processed")
    .eq("job_order_id", jobOrderId);

  if (posErr) throw new Error("Failed to load job order positions");
  
  const manpower = (positions as any[])?.reduce((sum, pos) => sum + (pos.needed || 0), 0) ?? 0;
  const processed = (positions as any[])?.reduce((sum, pos) => sum + (pos.processed || 0), 0) ?? 0;

  const hired = totalCount ?? 0;
  return {
    no_hired: hired,
    jo_balance: Math.max(0, manpower - processed),
    manpower_requested: manpower,
  };
}

export async function getAllJobOrdersV2(): Promise<JobOrderV2Row[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("job_orders")
    .select(`
      id, job_order_number, accreditation_id, foreign_partner_id, class,
      date_approved, valid_until, status_text, category, reference_number, parent_job_order_id,
      country, program_name, trade, gender_requirement, status, created_at,
      accreditation:accreditations!accreditation_id(date_expiration),
      positions:job_order_positions(id, position, position_code, needed, processed, salary_amount, salary_currency, salary_period, wage_type)
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to load job orders");

  return ((data ?? []) as any[]).map((row: any) => {
    const accExp = Array.isArray(row.accreditation)
      ? row.accreditation[0]?.date_expiration
      : row.accreditation?.date_expiration;
      
    const manpower = (row.positions as any[])?.reduce((sum, pos) => sum + (pos.needed || 0), 0) ?? 0;
    const processed = (row.positions as any[])?.reduce((sum, pos) => sum + (pos.processed || 0), 0) ?? 0;
    
    return {
      ...row,
      manpower_requested: manpower,
      jo_balance: Math.max(0, manpower - processed),
      accreditation_expiry_tier: accExp ? getExpiryTier(accExp) : undefined,
      jo_validity_tier: row.valid_until ? getExpiryTier(row.valid_until) : undefined,
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
