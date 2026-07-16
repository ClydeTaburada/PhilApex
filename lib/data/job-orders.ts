import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type JobOrderRow = {
  id: string;
  country: string;
  program_name: string;
  trade: string | null;
  position: string | null;
  gender_requirement: "male" | "female" | null;
  slots_total: number;
  slots_filled: number;
  status: "open" | "closed";
  created_at: string;
};

export async function getOpenJobOrders(): Promise<JobOrderRow[]> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("job_orders")
    .select("id, country, program_name, trade, position, gender_requirement, slots_total, slots_filled, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load open job orders");
  }

  return (data ?? []) as JobOrderRow[];
}

export async function getAllJobOrders(): Promise<JobOrderRow[]> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("job_orders")
    .select("id, country, program_name, trade, position, gender_requirement, slots_total, slots_filled, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load job orders");
  }

  return (data ?? []) as JobOrderRow[];
}

export async function syncJobOrderSlots(jobOrderId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { count, error } = await supabaseAdmin
    .from("applicants")
    .select("id, applicant_job_orders!inner(job_order_id)", { count: "exact", head: true })
    .eq("applicant_job_orders.job_order_id", jobOrderId)
    .in("current_pipeline_stage", ["matched", "deployed"]);

  if (error) {
    return; // slot sync is best-effort; caller does not need to fail
  }

  await (supabaseAdmin as any)
    .from("job_orders")
    .update({ slots_filled: count || 0 })
    .eq("id", jobOrderId);
}