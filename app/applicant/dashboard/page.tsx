import { redirect } from "next/navigation";
import { getApplicantSession } from "@/lib/applicant-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LogoutButton } from "./logout-button";
import { DocumentUploader } from "./document-uploader";
import { ProfileEditor } from "./profile-editor";
import { ChatWidget } from "@/components/chat-widget";

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

  // Fetch Deployment / Job Order if matched
  let deployment = null;
  try {
    const { data } = await (supabase as any)
      .from("deployments")
      .select(`
        id, visa_status, oec_number, flight_airline, flight_number, departure_datetime,
        batch:batches(
          job_order:job_orders(
            id, program_name, trade_name, country, position,
            partner:foreign_partners!principal_partner_id(name)
          )
        )
      `)
      .eq("applicant_id", session.applicant_id)
      .maybeSingle();
    deployment = data;
  } catch {
    try {
      const { data } = await (supabase as any)
        .from("deployments")
        .select(`
          id,
          batch:batches(
            job_order:job_orders(
              id, program_name, trade_name, country, position,
              partner:foreign_partners!principal_partner_id(name)
            )
          )
        `)
        .eq("applicant_id", session.applicant_id)
        .maybeSingle();
      deployment = data;
    } catch {
      // Fallback if columns don't exist yet
    }
  }

  const stages = [
    { key: "registered", label: "Registered", icon: "📝" },
    { key: "documents_complete", label: "Docs Complete", icon: "📄" },
    { key: "dmw_registered", label: "DMW Registered", icon: "🏛️" },
    { key: "peos_certified", label: "PEOS Certified", icon: "🎓" },
    { key: "matched", label: "Matched", icon: "🤝" },
    { key: "deployed", label: "Deployed", icon: "✈️" },
  ];
  const currentStageIndex = stages.findIndex(s => s.key === applicant.current_pipeline_stage);

  const missingDocs = (docs || []).filter((d: any) => d.status === "missing");
  const submittedDocs = (docs || []).filter((d: any) => d.status === "submitted");
  const verifiedDocs = (docs || []).filter((d: any) => d.status === "verified");

  return (
    <div className="flex-1 flex flex-col">

      {/* ═══════════ STICKY HEADER ═══════════ */}
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm mt-4 mx-4 rounded-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Applicant Portal</p>
          <p className="text-sm font-bold truncate max-w-[200px] text-white">{applicant.full_name}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-20">

        {/* ═══════════ PROFILE SUMMARY ═══════════ */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>My Profile</p>
            {applicant.reference_number && (
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200" style={{ color: "var(--navy)" }}>
                {applicant.reference_number}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Full Name</p>
              <p className="font-bold" style={{ color: "var(--ink)" }}>{applicant.full_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Date of Birth</p>
              <p className="font-medium" style={{ color: "var(--ink)" }}>{applicant.date_of_birth}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Gender</p>
              <p className="font-medium capitalize" style={{ color: "var(--ink)" }}>{applicant.gender}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Occupation Applied</p>
              <p className="font-medium" style={{ color: "var(--ink)" }}>{applicant.occupation_applied || "—"}</p>
            </div>
          </div>

          {/* Editable contact fields */}
          <ProfileEditor
            applicantId={applicant.id}
            cellphone={applicant.cellphone_number}
            email={applicant.email || ""}
            address={applicant.home_address || ""}
          />
        </div>

        {/* ═══════════ DEPLOYMENT INFO ═══════════ */}
        {deployment && (
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border-l-4" style={{ borderColor: "rgba(255,255,255,0.5)", borderLeftColor: "var(--crimson)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--navy)" }}>Employer Match</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Company</p>
                <p className="text-base font-bold" style={{ color: "var(--ink)" }}>{deployment.batch?.job_order?.partner?.name || "—"}</p>
                <p className="text-xs font-bold uppercase" style={{ color: "var(--crimson)" }}>{deployment.batch?.job_order?.country}</p>
              </div>
              {deployment.batch?.job_order?.position && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Position</p>
                  <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{deployment.batch.job_order.position}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════ STATUS CARDS ROW ═══════════ */}
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

        {/* ═══════════ DMW & PEOS DETAILS ═══════════ */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--navy)" }}>Compliance Status</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>DMW e-Registration #</p>
              <p className="text-sm font-bold mt-1" style={{ color: "var(--ink)" }}>
                {applicant.dmw_registration_number || <span className="text-amber-600 font-medium italic">Not yet registered</span>}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>PEOS Certificate</p>
              <p className={`text-sm font-bold uppercase mt-1 ${applicant.peos_certificate_status === 'completed' ? 'text-green-600' : applicant.peos_certificate_status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'}`}>
                {applicant.peos_certificate_status?.replace(/_/g, " ") || "Not Started"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>PEOS Modules Progress</p>
              <div className="flex gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-2.5 flex-1 rounded-full transition-all"
                    style={{
                      background: i < (applicant.peos_modules_completed || 0) ? "var(--crimson)" : "#e2e8f0",
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px] mt-1.5 font-bold text-right" style={{ color: "var(--ink-muted)" }}>
                {applicant.peos_modules_completed || 0} / 8 modules
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════ MISSING DOCUMENTS / UPLOAD ═══════════ */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--navy)" }}>Required Actions</p>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${missingDocs.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {missingDocs.length > 0 ? `${missingDocs.length} Missing` : "All Done"}
            </span>
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
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--ink)" }}>{doc.document_requirement?.doc_name || "Unknown Document"}</p>
                  {doc.document_requirement?.requires_file_upload ? (
                    <DocumentUploader documentId={doc.id} docName={doc.document_requirement?.doc_name || "Document"} />
                  ) : (
                    <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Please submit physical copy to office.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════ PIPELINE PROGRESS ═══════════ */}
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
                  <span className="text-base mr-1">{stage.icon}</span>
                  <p className={`text-sm font-bold ${isCurrent ? 'text-black' : isPast ? 'text-slate-600' : 'text-slate-400'}`}>{stage.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════ SUBMITTED & VERIFIED DOCUMENTS ═══════════ */}
        <div className="bg-white p-6 rounded-3xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--navy)" }}>Document Status</p>
          {submittedDocs.length === 0 && verifiedDocs.length === 0 ? (
            <p className="text-xs text-center italic py-4" style={{ color: "var(--ink-faint)" }}>No documents submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {[...verifiedDocs, ...submittedDocs].map((doc: any) => (
                <div key={doc.id} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>{doc.document_requirement?.doc_name || "Unknown Document"}</p>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════ CONTACT THE OFFICE ═══════════ */}
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--navy)" }}>Need Help?</p>
          <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
            For questions about your application, contact our processing team.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="mailto:support@phil-apex.com"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all hover:shadow-md active:scale-95"
              style={{ color: "var(--navy)", borderColor: "var(--navy)", background: "rgba(20,48,120,0.05)" }}
            >
              ✉️ Email Us
            </a>
            <a
              href="tel:+639XXXXXXXXX"
              className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all hover:shadow-md active:scale-95"
              style={{ color: "var(--crimson)", borderColor: "var(--crimson)", background: "rgba(180,30,60,0.05)" }}
            >
              📞 Call Us
            </a>
          </div>
        </div>
      </div>

      <ChatWidget 
        tableName="applicant_messages" 
        identifierColumn="applicant_id" 
        identifierValue={session.applicant_id} 
        senderType="applicant" 
      />
    </div>
  );
}