import { redirect } from "next/navigation";
import { getEmployerSession } from "@/lib/employer-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmployerLogoutButton } from "./logout-button";
import { ChatWidget } from "@/components/chat-widget";

export const dynamic = "force-dynamic";

/**
 * Privacy helper: "Juan Dela Cruz" → "Juan D."
 * Only exposes first name + last initial to employers.
 */
function toSafeName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "—";
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

export default async function EmployerDashboardPage() {
  const session = await getEmployerSession();
  if (!session) {
    redirect("/employer/login");
  }

  const supabase = getSupabaseAdminClient();

  // ── Fetch Company Profile ────────────────────────────────
  const { data: company } = await (supabase as any)
    .from("foreign_partners")
    .select("id, name, partner_type, contact_name, contact_email, contact_phone, contact_address")
    .eq("id", session.partner_id)
    .single();

  // ── Fetch Accreditations ─────────────────────────────────
  let accreditations: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from("accreditations")
      .select("id, accreditation_id_dmw, date_issued, date_expiration, status")
      .eq("principal_partner_id", session.partner_id)
      .order("date_expiration", { ascending: false });
    if (data) accreditations = data;
  } catch {
    // Accreditations table may not exist if Phase 2 migration hasn't run
  }

  // ── Fetch Job Orders ─────────────────────────────────────
  let jobOrders: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from("job_orders")
      .select(`
        id, job_order_number, position, manpower_requested, jo_validity_date, status,
        accreditation:accreditations(accreditation_id_dmw)
      `)
      .eq("foreign_partner_id", session.partner_id)
      .order("created_at", { ascending: false });
    if (data) jobOrders = data;
  } catch {
    // Job orders columns may not exist if Phase 2 migration hasn't run
  }

  // ── Fetch Deployments (PII-SAFE) ─────────────────────────
  // ONLY select: first name + last initial (computed), position, hired_date, entry_date, document_status
  // DO NOT select: full_name, passport, NBI, home_address, contact info, medical, pdos, pipeline stage, visa, flight
  let deployments: any[] = [];
  try {
    const { data, error } = await (supabase as any)
      .from("deployments")
      .select(`
        id, hired_date, entry_date, document_status,
        batch:batches!inner(
          batch_label,
          job_order:job_orders!inner(
            id, position, foreign_partner_id
          )
        ),
        applicant:applicants!inner(
          full_name
        )
      `)
      .eq("batch.job_order.foreign_partner_id", session.partner_id)
      .order("hired_date", { ascending: false });

    if (!error && data) {
      // Transform full_name to safe name server-side before reaching the client
      deployments = data.map((d: any) => ({
        ...d,
        applicant: {
          safe_name: toSafeName(d.applicant?.full_name || ""),
        },
      }));
    }
  } catch {
    // Fallback if migration hasn't run yet
  }

  // ── Compute Job Order Stats ──────────────────────────────
  const jobOrdersWithStats = jobOrders.map((jo: any) => {
    const hired = deployments.filter(d => d.batch?.job_order?.id === jo.id).length;
    return {
      ...jo,
      no_hired: hired,
      balance: (jo.manpower_requested || 0) - hired,
    };
  });

  // ── KPI Stats ────────────────────────────────────────────
  const totalAssigned = deployments.length;
  const dispatched = deployments.filter(d => d.document_status === "dispatched").length;
  const onProcess = deployments.filter(d => d.document_status === "on_process").length;

  // ── Accreditation tier helpers ───────────────────────────
  const today = new Date();
  function getAccreditationTier(acc: any): { label: string; color: string; bg: string } {
    const exp = new Date(acc.date_expiration);
    const daysUntilExpiry = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (acc.status === "expired_unconfirmed" || daysUntilExpiry < 0) {
      return { label: "EXPIRED", color: "text-red-700", bg: "bg-red-100" };
    }
    if (daysUntilExpiry <= 90) {
      return { label: `EXPIRING (${daysUntilExpiry}d)`, color: "text-amber-700", bg: "bg-amber-100" };
    }
    return { label: "ACTIVE", color: "text-green-700", bg: "bg-green-100" };
  }

  return (
    <div className="flex-1 flex flex-col">

      {/* ═══════════ STICKY HEADER ═══════════ */}
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm mt-4 mx-4 rounded-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Partner Portal</p>
          <p className="text-sm font-bold truncate max-w-[200px] text-white">{session.partner_name}</p>
        </div>
        <EmployerLogoutButton />
      </div>

      <div className="p-8 space-y-8 flex-1 overflow-y-auto pb-20 max-w-7xl mx-auto w-full">

        {/* ═══════════ COMPANY PROFILE (READ-ONLY) ═══════════ */}
        {company && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Company Profile</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Company Name</p>
                <p className="text-sm font-bold mt-1" style={{ color: "var(--ink)" }}>{company.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Type</p>
                <p className="text-sm font-medium mt-1 capitalize" style={{ color: "var(--ink)" }}>
                  {company.partner_type?.replace(/_/g, " ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Contact Person</p>
                <p className="text-sm font-medium mt-1" style={{ color: "var(--ink)" }}>{company.contact_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Contact Email</p>
                <p className="text-sm font-medium mt-1" style={{ color: "var(--ink)" }}>{company.contact_email || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ KPI CARDS ═══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Total Candidates</p>
            <p className="text-3xl font-black" style={{ color: "var(--ink)" }}>{totalAssigned}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>On Process</p>
            <p className="text-3xl font-black text-amber-600">{onProcess}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Deployed</p>
            <p className="text-3xl font-black" style={{ color: "var(--crimson)" }}>{dispatched}</p>
          </div>
        </div>

        {/* ═══════════ ACCREDITATIONS ═══════════ */}
        {accreditations.length > 0 && (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Accreditation Status</h2>
            </div>
            <div className="p-6 space-y-3">
              {accreditations.map((acc: any) => {
                const tier = getAccreditationTier(acc);
                return (
                  <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{acc.accreditation_id_dmw}</p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--ink-muted)" }}>
                        Issued: {acc.date_issued} — Expires: {acc.date_expiration}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-md ${tier.bg} ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ JOB ORDERS (READ-ONLY) ═══════════ */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Job Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>JO #</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Position</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Requested</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Hired</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Balance</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Validity</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobOrdersWithStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                      No job orders found.
                    </td>
                  </tr>
                ) : jobOrdersWithStats.map((jo: any) => (
                  <tr key={jo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-bold" style={{ color: "var(--ink)" }}>{jo.job_order_number || "—"}</td>
                    <td className="px-6 py-3 text-sm font-medium" style={{ color: "var(--ink)" }}>{jo.position || "—"}</td>
                    <td className="px-6 py-3 text-sm font-bold text-center">{jo.manpower_requested || "—"}</td>
                    <td className="px-6 py-3 text-sm font-bold text-center text-green-600">{jo.no_hired}</td>
                    <td className="px-6 py-3 text-sm font-bold text-center text-amber-600">{jo.balance}</td>
                    <td className="px-6 py-3 text-xs font-medium" style={{ color: "var(--ink-muted)" }}>{jo.jo_validity_date || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${jo.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {jo.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════ CANDIDATES TABLE (PII-SAFE) ═══════════ */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Assigned Candidates</h2>
            <p className="text-[10px] mt-1" style={{ color: "var(--ink-muted)" }}>
              Showing limited candidate details for privacy. Contact the agency for full information.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Candidate</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Position</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Hired Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Entry Date</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deployments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                      No candidates have been assigned to your job orders yet.
                    </td>
                  </tr>
                ) : deployments.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold" style={{ color: "var(--ink)" }}>{d.applicant?.safe_name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{d.batch?.job_order?.position || "—"}</p>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {d.hired_date || "—"}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium" style={{ color: "var(--ink)" }}>
                      {d.entry_date || "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${d.document_status === 'dispatched' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {d.document_status === "dispatched" ? "Deployed" : "On Process"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════ CONTACT THE AGENCY ═══════════ */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--navy)" }}>Need Assistance?</p>
          <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
            For detailed candidate information or job order inquiries, please contact our team.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="mailto:support@phil-apex.com"
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl border transition-all hover:shadow-md active:scale-95"
              style={{ color: "var(--navy)", borderColor: "var(--navy)", background: "rgba(20,48,120,0.05)" }}
            >
              ✉️ Email Phil-Apex
            </a>
            <a
              href="tel:+639XXXXXXXXX"
              className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl border transition-all hover:shadow-md active:scale-95"
              style={{ color: "var(--crimson)", borderColor: "var(--crimson)", background: "rgba(180,30,60,0.05)" }}
            >
              📞 Call Us
            </a>
          </div>
        </div>
      </div>

      <ChatWidget 
        tableName="employer_messages" 
        identifierColumn="partner_id" 
        identifierValue={session.partner_id} 
        senderType="employer" 
      />
    </div>
  );
}
