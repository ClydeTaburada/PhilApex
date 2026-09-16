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
    .select(`
      id, country, program_name, trade, gender_requirement, status, created_at,
      positions:job_order_positions(position, needed, processed)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load open job orders: " + error.message);
  }

  return ((data ?? []) as any[]).map((row: any) => {
    const posList = Array.isArray(row.positions) ? row.positions : row.positions ? [row.positions] : [];
    const positionNames = posList.map((p: any) => p.position).filter(Boolean).join(", ");
    const needed = posList.reduce((s: number, p: any) => s + (p.needed || 0), 0);
    const processed = posList.reduce((s: number, p: any) => s + (p.processed || 0), 0);
    return {
      id: row.id,
      country: row.country,
      program_name: row.program_name,
      trade: row.trade,
      position: positionNames || row.trade || "",
      gender_requirement: row.gender_requirement,
      slots_total: needed,
      slots_filled: processed,
      status: row.status,
      created_at: row.created_at,
    };
  });
}

export async function getAllJobOrders(): Promise<JobOrderRow[]> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("job_orders")
    .select(`
      id, country, program_name, trade, gender_requirement, status, created_at,
      positions:job_order_positions(position, needed, processed)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load job orders: " + error.message);
  }

  return ((data ?? []) as any[]).map((row: any) => {
    const posList = Array.isArray(row.positions) ? row.positions : row.positions ? [row.positions] : [];
    const positionNames = posList.map((p: any) => p.position).filter(Boolean).join(", ");
    const needed = posList.reduce((s: number, p: any) => s + (p.needed || 0), 0);
    const processed = posList.reduce((s: number, p: any) => s + (p.processed || 0), 0);
    return {
      id: row.id,
      country: row.country,
      program_name: row.program_name,
      trade: row.trade,
      position: positionNames || row.trade || "",
      gender_requirement: row.gender_requirement,
      slots_total: needed,
      slots_filled: processed,
      status: row.status,
      created_at: row.created_at,
    };
  });
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

  // Update processed count on job_order_positions if applicable
  const { data: positions } = await (supabaseAdmin as any)
    .from("job_order_positions")
    .select("id")
    .eq("job_order_id", jobOrderId)
    .limit(1);

  if (positions && positions.length > 0) {
    await (supabaseAdmin as any)
      .from("job_order_positions")
      .update({ processed: count || 0 })
      .eq("id", positions[0].id);
  }
}