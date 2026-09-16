import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContractEndAlerts } from "@/lib/data/batches";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const context = await requireStaffContext();
  const supabase = getSupabaseAdminClient();

  // 1. Fetch Aggregates from RPC
  const { data: aggregates, error: aggError } = await (supabase as any).rpc("get_dashboard_aggregates");
  
  if (aggError && !aggError.message?.includes("function get_dashboard_aggregates() does not exist")) {
    console.error("RPC Error:", aggError);
  }

  const agg = aggregates || {
    total_applicants: 0,
    pipeline_funnel: {},
    source_breakdown: {},
    top_missing_document: null,
    currently_deployed: 0,
    historical_deployed: 0,
    program_breakdown: [],
    job_order_fill_rate: { total_requested: 0, total_filled: 0 },
  };

  // 2. Fetch Accreditations nearing expiry (< 60 days)
  const { data: accreditations } = await supabase
    .from("accreditations")
    .select(`
      id, accreditation_id_dmw, date_expiration,
      partner:foreign_partners!principal_partner_id(name)
    `)
    .lte("date_expiration", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString())
    .order("date_expiration", { ascending: true });

  const acc = ((accreditations as any) || []).map((a: any) => {
    const days = Math.floor((new Date(a.date_expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    let tier: "ok" | "warn_60" | "warn_30" | "expired" = "ok";
    if (days < 0) tier = "expired";
    else if (days <= 30) tier = "warn_30";
    else if (days <= 60) tier = "warn_60";
    return { ...a, days, tier };
  });

  // 3. Fetch Contract Alerts
  const contractAlerts = await getContractEndAlerts();
  // Filter for next 90 days only
  const soonAlerts = contractAlerts.filter((alertItem: any) => {
    const a = alertItem as any;
    if (!a.entry_date || !a.batch?.job_order?.program?.standard_duration_years) return false;
    const durMs = a.batch.job_order.program.standard_duration_years * 365 * 24 * 60 * 60 * 1000;
    const endApprox = new Date(a.entry_date).getTime() + durMs;
    const daysRemaining = (endApprox - Date.now()) / (1000 * 60 * 60 * 24);
    return daysRemaining <= 90 && daysRemaining >= -30;
  });

  // 4. Fetch Top Open Job Orders for Fulfillment Chart
  const { data: topJobOrdersRaw } = await (supabase as any)
    .from("job_orders")
    .select(`
      id, job_order_number,
      positions:job_order_positions(position, needed, processed)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(5);

  const topJobOrders = (topJobOrdersRaw || []).map((jo: any) => {
    const posList = Array.isArray(jo.positions) ? jo.positions : jo.positions ? [jo.positions] : [];
    const posTitle = posList.map((p: any) => p.position).filter(Boolean).join(", ") || jo.job_order_number || "Open Position";
    const needed = posList.reduce((sum: number, p: any) => sum + (p.needed || 0), 0);
    const processed = posList.reduce((sum: number, p: any) => sum + (p.processed || 0), 0);
    return {
      position: posTitle,
      manpower_requested: needed,
      slots_filled: processed,
    };
  });

  return (
    <StaffShell
      active="dashboard"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Overview Dashboard"
      subtitle="High-level metrics across applicant intake and active deployments."
      layoutMode="canonical"
    >
      <DashboardClient 
        agg={agg} 
        acc={acc} 
        soonAlerts={soonAlerts} 
        topJobOrders={topJobOrders}
        aggErrorMsg={aggError?.message} 
      />
    </StaffShell>
  );
}