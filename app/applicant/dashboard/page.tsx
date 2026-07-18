import { redirect } from "next/navigation";
import { getApplicantSession } from "@/lib/applicant-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { DocumentUploader } from "./document-uploader";

export const dynamic = "force-dynamic";

export default async function ApplicantDashboardPage() {
  const session = await getApplicantSession();
  if (!session) {
    redirect("/applicant/login");
  }

  const supabase = getSupabaseAdminClient();

  // Fetch Applicant
  const { data: applicant } = await (supabase as any)
    .from("applicants")
    .select("*")
    .eq("id", session.applicant_id)
    .single();

  if (!applicant) redirect("/applicant/login");

  // Fetch Documents
  const { data: docs } = await (supabase as any)
    .from("applicant_documents")
    .select(`
      id, status, file_path,
      document_requirement:document_requirements(doc_name, requires_file_upload)
    `)
    .eq("applicant_id", session.applicant_id);

  // Fetch Deployments / Job Order if matched
  // Using try-catch just in case the user hasn't run the Phase 5 migration yet
  let deployment = null;
  try {
    const { data } = await (supabase as any)
      .from("deployments")
      .select(`
        id, visa_status, oec_number, flight_airline, flight_number, departure_datetime,
        batch:batches(
          job_order:job_orders(
            id, program_name, trade_name, country,
            partner:foreign_partners!principal_partner_id(name)
          )
        )
      `)
      .eq("applicant_id", session.applicant_id)
      .maybeSingle();
    deployment = data;
  } catch (err) {
    // Fallback if columns don't exist yet
    const { data } = await (supabase as any)
      .from("deployments")
      .select(`
        id,
        batch:batches(
          job_order:job_orders(
            id, program_name, trade_name, country,
            partner:foreign_partners!principal_partner_id(name)
          )
        )
      `)
      .eq("applicant_id", session.applicant_id)
      .maybeSingle();
    deployment = data;
  }

  const stages = [
    { key: "registered", label: "Registered" },
    { key: "documents_complete", label: "Docs Complete" },
    { key: "dmw_registered", label: "DMW Reg" },
    { key: "peos_certified", label: "PEOS" },
    { key: "matched", label: "Matched" },
    { key: "deployed", label: "Deployed" },
  ];
  const currentStageIndex = stages.findIndex(s => s.key === applicant.current_pipeline_stage);

  const missingDocs = (docs || []).filter((d: any) => d.status === "missing");
  const submittedDocs = (docs || []).filter((d: any) => d.status !== "missing");

  return (
    <div className="flex-1 flex flex-col">
      
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 border-b border-slate-800/80 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-md opacity-40 rounded-full"></div>
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="rounded-full relative z-10 border border-slate-700" />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Phil-Apex</p>
            <p className="text-sm font-bold text-slate-100 truncate max-w-[150px]">{applicant.full_name}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20">
        
        {/* Medical & Training Quick Status (Logistics) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medical</p>
            {applicant.medical_status === 'fit' ? (
              <span className="text-emerald-400 font-black text-lg drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">FIT TO WORK</span>
            ) : applicant.medical_status === 'unfit' ? (
              <span className="text-red-400 font-black text-lg">UNFIT</span>
            ) : (
              <span className="text-amber-400 font-black text-lg">PENDING</span>
            )}
          </div>
          <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PDOS Training</p>
            {applicant.pdos_completed ? (
              <span className="text-indigo-400 font-black text-lg drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">COMPLETED</span>
            ) : (
              <span className="text-slate-500 font-black text-lg">PENDING</span>
            )}
          </div>
        </div>

        {/* Job Order & Flight Info */}
        {deployment?.batch?.job_order && (
          <div className="relative p-6 rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-xl z-0" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none z-0" />
            
            <div className="relative z-10 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Employer Match</h2>
                  <p className="text-xl font-black drop-shadow-md">{deployment.batch.job_order.partner?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-200 uppercase">{deployment.batch.job_order.country}</p>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-white/5 mb-4">
                <p className="text-sm font-bold text-indigo-100">{deployment.batch.job_order.trade_name}</p>
                <p className="text-xs text-indigo-300 mt-1">{deployment.batch.job_order.program_name}</p>
              </div>

              {/* Visa & Flight details if available */}
              {(deployment.visa_status || deployment.flight_airline) && (
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-indigo-500/30">
                  <div>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase">Visa Status</p>
                    <p className={`text-sm font-black ${deployment.visa_status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {deployment.visa_status?.toUpperCase() || "PENDING"}
                    </p>
                    {deployment.oec_number && <p className="text-[10px] text-indigo-200 mt-1">OEC: {deployment.oec_number}</p>}
                  </div>
                  {deployment.flight_airline && (
                    <div>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase">Flight Info</p>
                      <p className="text-sm font-bold">{deployment.flight_airline} {deployment.flight_number}</p>
                      {deployment.departure_datetime && (
                        <p className="text-xs text-indigo-200 mt-1">{new Date(deployment.departure_datetime).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Required: Missing Documents */}
        <div className="bg-slate-800/40 backdrop-blur-md p-5 rounded-3xl shadow-xl border border-red-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          <h2 className="text-xs font-black text-red-400 uppercase tracking-widest mb-5 flex justify-between items-center">
            <span>Action Required</span>
            {missingDocs.length > 0 && <span className="bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-0.5 rounded-md text-[10px]">{missingDocs.length} Missing</span>}
          </h2>
          
          {missingDocs.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                <span className="text-emerald-400 text-xl">✓</span>
              </div>
              <p className="text-sm text-slate-300 font-medium">All required documents submitted!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingDocs.map((doc: any) => (
                <DocumentUploader key={doc.id} documentId={doc.id} docName={doc.document_requirement?.doc_name} />
              ))}
            </div>
          )}
        </div>

        {/* Status Tracker */}
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-700/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Pipeline Progress</h2>
          <div className="relative pl-2">
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-700 rounded-full" />
            <div className="space-y-8">
              {stages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;
                
                return (
                  <div key={stage.key} className={`relative flex items-center gap-5 ${isPending ? 'opacity-30' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 shadow-lg
                      ${isCompleted ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                      : isCurrent ? 'bg-slate-900 border-2 border-indigo-400 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                      : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                      {isCompleted ? <span className="text-sm">✓</span> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-black tracking-wide ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>{stage.label}</p>
                      {isCurrent && <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider mt-1">Current Stage</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submitted Documents */}
        {submittedDocs.length > 0 && (
          <div className="bg-slate-800/20 backdrop-blur-sm p-5 rounded-3xl border border-slate-800/50">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Submitted Files</h2>
            <div className="space-y-2">
              {submittedDocs.map((doc: any) => (
                <div key={doc.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <span className="text-xs font-medium text-slate-300">{doc.document_requirement?.doc_name}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md 
                    ${doc.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}