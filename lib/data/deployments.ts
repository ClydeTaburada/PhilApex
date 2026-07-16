import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeploymentMonitoringRow = {
  id: string;
  applicant_id: string;
  applicant_name: string | null;
  batch_id: string;
  batch_label: string | null;
  job_order_id: string | null;
  job_order_number: string | null;
  position: string | null;
  foreign_partner_name: string | null;
  program_name: string | null;
  country: string | null;
  hired_date: string;
  entry_date: string | null;
  deployment_end_date: string | null;
  document_status: "on_process" | "dispatched";
  dispatched_date: string | null;
};

export async function getDeploymentMonitoringRows(q?: string): Promise<DeploymentMonitoringRow[]> {
  const supabase = getSupabaseAdminClient();
  let query = (supabase as any)
    .from("deployments")
    .select(`
      id, applicant_id, batch_id, hired_date, entry_date, deployment_end_date,
      document_status, dispatched_date,
      applicant:applicants!applicant_id(full_name),
      batch:batches!batch_id(
        batch_label, job_order_id,
        job_order:job_orders!job_order_id(
          job_order_number, position,
          foreign_partner_id,
          partner:foreign_partners!foreign_partner_id(name, program_id, program:programs!program_id(name, country))
        )
      )
    `)
    .order("hired_date", { ascending: false });

  if (q && q.trim()) {
    query = query.ilike("applicant.full_name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to load deployment monitoring rows");

  return ((data ?? []) as any[]).map((row) => {
    const applicant = Array.isArray(row.applicant) ? row.applicant[0] : row.applicant;
    const batch = Array.isArray(row.batch) ? row.batch[0] : row.batch;
    const jo = Array.isArray(batch?.job_order) ? batch.job_order[0] : batch?.job_order;
    const partner = Array.isArray(jo?.partner) ? jo.partner[0] : jo?.partner;
    const program = Array.isArray(partner?.program) ? partner.program[0] : partner?.program;

    return {
      id: row.id,
      applicant_id: row.applicant_id,
      applicant_name: applicant?.full_name ?? null,
      batch_id: row.batch_id,
      batch_label: batch?.batch_label ?? null,
      job_order_id: batch?.job_order_id ?? null,
      job_order_number: jo?.job_order_number ?? null,
      position: jo?.position ?? null,
      foreign_partner_name: partner?.name ?? null,
      program_name: program?.name ?? null,
      country: program?.country ?? null,
      hired_date: row.hired_date,
      entry_date: row.entry_date,
      deployment_end_date: row.deployment_end_date,
      document_status: row.document_status,
      dispatched_date: row.dispatched_date,
    } as DeploymentMonitoringRow;
  });
}
