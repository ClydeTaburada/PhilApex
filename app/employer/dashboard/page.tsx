import { redirect } from "next/navigation";
import { getEmployerSession } from "@/lib/employer-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import { EmployerLogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const session = await getEmployerSession();
  if (!session) {
    redirect("/employer/login");
  }

  const supabase = getSupabaseAdminClient();

  // Fetch all Deployments linked to this employer's Job Orders
  // We need to join: deployments -> batches -> job_orders -> foreign_partners
  // AND deployments -> applicants
  let deployments: any[] = [];
  try {
    const { data, error } = await (supabase as any)
      .from("deployments")
      .select(`
        id, hired_date, visa_status, flight_airline, flight_number, departure_datetime, document_status,
        batch:batches!inner(
          batch_label,
          job_order:job_orders!inner(
            id, position, foreign_partner_id
          )
        ),
        applicant:applicants!inner(
          full_name, medical_status, pdos_completed, current_pipeline_stage
        )
      `)
      .eq("batch.job_order.foreign_partner_id", session.partner_id)
      .order("hired_date", { ascending: false });
      
    if (!error && data) {
      deployments = data;
    }
  } catch (err) {
    // Fallback if migration hasn't run yet
  }

  // Calculate some stats
  const totalAssigned = deployments.length;
  const fitToWork = deployments.filter(d => d.applicant?.medical_status === "fit").length;
  const visaApproved = deployments.filter(d => d.visa_status === "approved").length;
  const dispatched = deployments.filter(d => d.document_status === "dispatched").length;

  return (
    <div className="flex-1 flex flex-col">
      
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm mt-4 mx-4 rounded-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Partner Portal</p>
          <p className="text-sm font-bold truncate max-w-[200px] text-white">{session.partner_name}</p>
        </div>
        <EmployerLogoutButton />
      </div>

      <div className="p-8 space-y-8 flex-1 overflow-y-auto pb-20 max-w-7xl mx-auto w-full">
        
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Total Assigned</p>
            <p className="text-3xl font-black" style={{ color: "var(--ink)" }}>{totalAssigned}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Medical Passed</p>
            <p className="text-3xl font-black text-green-600">{fitToWork}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Visa Approved</p>
            <p className="text-3xl font-black text-blue-600">{visaApproved}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Deployed</p>
            <p className="text-3xl font-black" style={{ color: "var(--crimson)" }}>{dispatched}</p>
          </div>
        </div>

        {/* Assigned Workers Table */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Assigned Candidates Monitoring</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Candidate</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Job/Batch</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Medical/PDOS</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Logistics</th>
                </tr>
              </thead>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-200">{d.applicant?.full_name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-medium text-slate-300">{d.batch?.job_order?.position || "—"}</p>
                      <p className="text-[10px] text-teal-500/80 mt-0.5">{d.batch?.batch_label}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md 
                        ${d.applicant?.medical_status === 'fit' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                        : d.applicant?.medical_status === 'unfit' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {d.applicant?.medical_status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md 
                        ${d.visa_status === 'approved' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : d.visa_status === 'denied' ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                        {d.visa_status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {(d.flight_airline || d.flight_number) ? (
                        <div>
                          <p className="text-sm font-bold text-slate-200">{d.flight_airline} {d.flight_number}</p>
                          {d.departure_datetime && (
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(d.departure_datetime).toLocaleString()}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">—</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {d.document_status === "dispatched" ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]">
                          Dispatched
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                          Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {deployments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No candidates have been assigned to your organization yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
