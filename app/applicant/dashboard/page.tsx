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
      
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm mt-4 mx-4 rounded-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Applicant Portal</p>
          <p className="text-sm font-bold truncate max-w-[200px] text-white">{applicant.full_name}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-20">
        
        {deployment && (
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border-l-4" style={{ borderColor: "rgba(255,255,255,0.5)", borderLeftColor: "var(--crimson)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--navy)" }}>Employer Match</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Company</p>
                <p className="text-base font-bold" style={{ color: "var(--ink)" }}>{deployment.batch?.job_order?.partner?.name || "—"}</p>
                <p className="text-xs font-bold uppercase" style={{ color: "var(--crimson)" }}>{deployment.batch?.job_order?.country}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Visa Status</p>
                  <p className={`text-sm font-bold uppercase mt-1 ${deployment.visa_status === 'approved' ? 'text-green-600' : deployment.visa_status === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                    {deployment.visa_status || 'PENDING'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Flight Info</p>
                  {(deployment.flight_airline || deployment.flight_number) ? (
                    <>
                      <p className="text-xs font-bold mt-1" style={{ color: "var(--ink)" }}>{deployment.flight_airline} {deployment.flight_number}</p>
                      {deployment.departure_datetime && (
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{new Date(deployment.departure_datetime).toLocaleDateString()}</p>
                      )}
                    </>
                  ) : <p className="text-xs font-medium mt-1" style={{ color: "var(--ink-muted)" }}>—</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl flex flex-col justify-center border border-white/50">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>Medical Status</p>
            <p className={`text-sm font-black uppercase ${applicant.medical_status === 'fit' ? 'text-green-600' : applicant.medical_status === 'unfit' ? 'text-red-600' : 'text-amber-600'}`}>
              {applicant.medical_status || "PENDING"}
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl flex flex-col justify-center border border-white/50">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--navy)" }}>PDOS Training</p>
            <p className={`text-sm font-black uppercase ${applicant.pdos_completed ? 'text-green-600' : 'text-amber-600'}`}>
              {applicant.pdos_completed ? "Completed" : "Pending"}
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Required Actions</p>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-full">{missingDocs.length} Missing</span>
          </div>
          
          {missingDocs.length === 0 ? (
            <div className="text-center py-4 bg-green-50/50 rounded-xl">
              <p className="text-green-600 text-xl mb-1">✓</p>
              <p className="text-xs font-bold text-green-700">All documents submitted!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missingDocs.map((doc: any) => (
                <div key={doc.id} className="bg-white/80 border border-slate-100 p-3 rounded-xl shadow-sm">
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--ink)" }}>{doc.document_requirement.doc_name}</p>
                  {doc.document_requirement.requires_file_upload ? (
                    <DocumentUploader documentId={doc.id} docName={doc.document_requirement.doc_name} />
                  ) : (
                    <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Please submit physical copy to office.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Tracker */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "var(--navy)" }}>Application Progress</p>
          <div className="flex flex-col gap-3">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              
              let dotClass = "bg-slate-200 border-slate-300";
              if (isPast) dotClass = "bg-green-500 border-green-600";
              if (isCurrent) dotClass = "animate-pulse border-4";
              
              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full border shadow-inner z-10 ${dotClass}`} style={isCurrent ? { background: "var(--crimson)", borderColor: "var(--crimson)" } : {}}></div>
                  <p className={`text-sm font-bold ${isCurrent ? 'text-black' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>{stage.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submitted Documents */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--navy)" }}>Submitted Documents</p>
          {submittedDocs.length === 0 ? (
            <p className="text-xs text-center italic py-4" style={{ color: "var(--ink-faint)" }}>No documents submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {submittedDocs.map((doc: any) => (
                <div key={doc.id} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>{doc.document_requirement.doc_name}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}