import Link from "next/link";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContractEndAlerts } from "@/lib/data/batches";
import { ExpiryBadge } from "@/components/expiry-badge";

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

  const funnelStages = [
    { key: "registered", label: "Registered", color: "var(--navy)" },
    { key: "documents_complete", label: "Docs Complete", color: "var(--purple)" },
    { key: "dmw_registered", label: "DMW Reg", color: "var(--amber)" },
    { key: "peos_certified", label: "PEOS", color: "var(--orange)" },
    { key: "matched", label: "Matched", color: "var(--teal)" },
    { key: "deployed", label: "Deployed", color: "var(--green)" },
  ];

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

  return (
    <StaffShell
      active="dashboard"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Overview Dashboard"
      subtitle="High-level metrics across applicant intake and active deployments."
    >
      {aggError && (
        <div className="alert alert-error mb-6">
          <strong>Database RPC Error:</strong> {aggError.message}
          {aggError.message.includes("does not exist") && (
            <p className="mt-2 text-sm">Please run the `20260717_dashboard_rpc.sql` migration in your Supabase SQL Editor. If you already ran it, try running `NOTIFY pgrst, 'reload schema';` to refresh the cache.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Applicant Intake */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="card p-6 border-t-4" style={{ borderTopColor: "var(--navy)" }}>
            <h2 className="text-lg font-bold mb-4">Applicant Pipeline</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                <p className="text-3xl font-black text-primary">{agg.total_applicants}</p>
                <p className="text-xs font-bold text-ink-muted uppercase mt-1">Total Applicants</p>
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium mb-3">Pipeline Funnel</p>
                <div className="flex h-12 w-full rounded-full overflow-hidden mb-2 shadow-inner bg-gray-100">
                  {funnelStages.map(s => {
                    const count = agg.pipeline_funnel[s.key] || 0;
                    if (count === 0) return null;
                    const pct = (count / agg.total_applicants) * 100;
                    return (
                      <Link 
                        key={s.key} 
                        href={`/staff/applicants?pipeline_stage=${s.key}`}
                        title={`${s.label}: ${count}`}
                        className="h-full hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      >
                        {count > (agg.total_applicants * 0.05) && count}
                      </Link>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-ink-muted">
                  {funnelStages.map(s => (
                    <Link key={s.key} href={`/staff/applicants?pipeline_stage=${s.key}`} className="hover:text-primary">
                      {s.label} ({agg.pipeline_funnel[s.key] || 0})
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4">
                <h3 className="text-xs font-bold text-ink-muted uppercase mb-3">Source Breakdown</h3>
                <div className="space-y-2">
                  {["walk_in", "job_fair", "lgu_peso", "referral", "online"].map(src => {
                    const count = agg.source_breakdown[src] || 0;
                    if (count === 0) return null;
                    const pct = Math.round((count / agg.total_applicants) * 100);
                    return (
                      <Link key={src} href={`/staff/applicants?source=${src}`} className="block group">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize group-hover:text-primary group-hover:underline">{src.replace("_", " ")}</span>
                          <span className="font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                  {Object.keys(agg.source_breakdown || {}).length === 0 && <p className="text-sm text-ink-faint">No sources tracked yet.</p>}
                </div>
              </div>

              {agg.top_missing_document && (
                <Link href={`/staff/applicants?missing_document=${agg.top_missing_document.doc_id}`} className="border rounded-xl p-4 bg-orange-50/50 hover:bg-orange-50 transition-colors block">
                  <h3 className="text-xs font-bold text-orange-600 uppercase mb-2 flex items-center gap-2">
                    <span>?</span> Top Missing Document
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    <strong className="text-ink">{agg.top_missing_document.doc_name}</strong> is currently missing for 
                    <strong className="text-crimson text-lg ml-1 mr-1">{agg.top_missing_document.count}</strong> 
                    applicants below the "Documents Complete" stage.
                  </p>
                  <p className="text-xs text-orange-600 font-bold mt-3">Click to view affected applicants ?</p>
                </Link>
              )}
            </div>
          </div>

          <div className="card p-6 border-t-4" style={{ borderTopColor: "var(--teal)" }}>
            <h2 className="text-lg font-bold mb-4">Deployments & Job Orders</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-teal-50 rounded-xl p-4 flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-teal-700">{agg.currently_deployed}</p>
                <p className="text-xs font-bold text-teal-900/60 uppercase mt-1">Currently Deployed</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col justify-center items-center">
                <p className="text-3xl font-black text-ink-muted">{agg.historical_deployed}</p>
                <p className="text-xs font-bold text-ink-faint uppercase mt-1">Historical Deployments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-bold text-ink-muted uppercase mb-3">By Program & Country</h3>
                <div className="space-y-3">
                  {agg.program_breakdown.map((p: any, i: number) => (
                    <Link key={i} href={`/staff/companies?program=${encodeURIComponent(p.program)}&country=${encodeURIComponent(p.country)}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                      <div>
                        <p className="text-sm font-bold group-hover:text-primary">{p.program}</p>
                        <p className="text-[10px] text-ink-muted uppercase">{p.country}</p>
                      </div>
                      <span className="badge badge-teal">{p.count} deployed</span>
                    </Link>
                  ))}
                  {agg.program_breakdown.length === 0 && <p className="text-sm text-ink-faint">No active deployments.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-ink-muted uppercase mb-3">Job Order Fill Rate</h3>
                <Link href="/staff/job-orders?status=open" className="block border rounded-xl p-4 hover:border-primary group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-muted">Open Job Orders</span>
                    <span className="font-bold">{agg.job_order_fill_rate.total_filled} / {agg.job_order_fill_rate.total_requested}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500" 
                      style={{ width: `${agg.job_order_fill_rate.total_requested > 0 ? (agg.job_order_fill_rate.total_filled / agg.job_order_fill_rate.total_requested) * 100 : 0}%` }} 
                    />
                  </div>
                  <p className="text-[10px] text-ink-faint uppercase mt-2 text-right group-hover:text-primary">View Open JOs ?</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts */}
        <div className="space-y-6">
          <div className="card p-5 border-t-4" style={{ borderTopColor: "var(--crimson)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>??</span> Accreditations Nearing Expiry
            </h2>
            <div className="space-y-3">
              {acc.length === 0 ? (
                <p className="text-sm text-ink-faint text-center py-4">No accreditations expiring within 60 days.</p>
              ) : acc.map((a: any) => (
                <Link key={a.id} href={`/staff/accreditations?id=${a.id}`} className="block border rounded-lg p-3 hover:border-primary transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-ink max-w-[140px] truncate">{a.partner?.name || a.accreditation_id_dmw}</span>
                    <ExpiryBadge tier={a.tier} />
                  </div>
                  <p className="text-[10px] text-ink-muted">Expires: {new Date(a.date_expiration).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5 border-t-4" style={{ borderTopColor: "var(--orange)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>?</span> Contract End Alerts
            </h2>
            <div className="space-y-3">
              {soonAlerts.length === 0 ? (
                <p className="text-sm text-ink-faint text-center py-4">No deployments ending within 90 days.</p>
              ) : soonAlerts.map((a: any) => (
                <Link key={a.id} href={`/staff/applicants/${a.applicant_id}`} className="block border rounded-lg p-3 hover:border-primary transition-colors">
                  <p className="text-sm font-bold mb-1">{a.applicant?.full_name}</p>
                  <p className="text-[10px] text-ink-muted mb-2">{a.batch?.job_order?.program_name} — {a.batch?.job_order?.country}</p>
                  <div className="bg-orange-50 text-orange-800 text-[10px] font-bold px-2 py-1 rounded w-max">
                    Action required soon
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </StaffShell>
  );
}