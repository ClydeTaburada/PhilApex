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

  // Find 2x2 Picture
  const pictureDoc = docs?.find((d: any) => 
    d.document_requirement?.doc_name?.toLowerCase().includes("2x2") ||
    d.document_requirement?.doc_name?.toLowerCase().includes("picture") ||
    d.document_requirement?.doc_name?.toLowerCase().includes("photo")
  );

  let profilePictureUrl = null;
  if (pictureDoc?.file_path) {
    const { data: { publicUrl } } = supabase
      .storage
      .from("applicant_documents")
      .getPublicUrl(pictureDoc.file_path);
    profilePictureUrl = publicUrl;
  }

  return (
    <div className="flex-1 flex flex-col bg-surface">

      {/* ═══════════ STICKY HEADER ═══════════ */}
      <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-white/40 backdrop-blur-xl border-b border-white/40 shadow-sm mt-4 mx-4 rounded-2xl transition-all duration-300">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-navy/80">Applicant Portal</p>
          <p className="text-sm font-bold truncate max-w-[200px] text-navy">{applicant.full_name}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="p-4 flex-1 overflow-y-auto pb-20 max-w-7xl mx-auto w-full">
        
        {/* CSS Columns layout. Everything inside will flow top-to-bottom, wrapping to the next column on desktop */}
        <div className="columns-1 lg:columns-2 gap-5 space-y-5">
          
          {/* 1. PIPELINE PROGRESS (Rendered first for mobile) */}
          <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/50">
            <p className="text-xs font-bold uppercase tracking-widest mb-6 text-navy">Application Progress</p>
            <div className="flex flex-col gap-4">
              {stages.map((stage, idx) => {
                const isPast = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                let dotClass = "bg-slate-200 border-slate-300";
                if (isPast) dotClass = "bg-green-500 border-green-600 shadow-sm";
                if (isCurrent) dotClass = "animate-pulse border-4 bg-crimson border-crimson/30 shadow-md";

                return (
                  <div key={stage.key} className="flex items-center gap-4 group cursor-default">
                    <div className={`w-4 h-4 rounded-full border shadow-inner z-10 transition-all duration-300 group-hover:scale-110 ${dotClass}`}></div>
                    <span className="text-lg mr-2 drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{stage.icon}</span>
                    <p className={`text-sm font-bold transition-colors ${isCurrent ? 'text-black' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>{stage.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. MISSING DOCUMENTS / UPLOAD */}
          <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/50">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-navy">Required Actions</p>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full ${missingDocs.length > 0 ? 'bg-red-100 text-red-600 shadow-sm' : 'bg-green-100 text-green-600 shadow-sm'}`}>
                {missingDocs.length > 0 ? `${missingDocs.length} Missing` : "All Done"}
              </span>
            </div>

            {missingDocs.length === 0 ? (
              <div className="text-center py-6 bg-green-50/80 rounded-2xl border border-green-100">
                <p className="text-green-600 text-2xl mb-2">✓</p>
                <p className="text-sm font-bold text-green-700">All documents submitted!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {missingDocs.map((doc: any) => (
                  <div key={doc.id} className="bg-white/80 border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-sm font-bold mb-1.5 text-ink">{doc.document_requirement?.doc_name || "Unknown Document"}</p>
                    {doc.document_requirement?.requires_file_upload ? (
                      <DocumentUploader documentId={doc.id} docName={doc.document_requirement?.doc_name || "Document"} />
                    ) : (
                      <p className="text-xs text-ink-muted">Please submit physical copy to office.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. DEPLOYMENT INFO */}
          {deployment && (
            <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-white/50 border-l-crimson">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-navy">Employer Match</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-0.5">Company</p>
                  <p className="text-base font-bold text-ink">{deployment.batch?.job_order?.partner?.name || "—"}</p>
                  <p className="text-xs font-bold uppercase text-crimson mt-0.5">{deployment.batch?.job_order?.country}</p>
                </div>
                {deployment.batch?.job_order?.position && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-0.5">Position</p>
                    <p className="text-sm font-bold text-ink">{deployment.batch.job_order.position}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. PROFILE SUMMARY */}
          <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/50">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-navy">My Profile</p>
              {applicant.reference_number && (
                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-navy">
                  {applicant.reference_number}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 mb-5 items-start">
              {/* Profile Avatar */}
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile Picture" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-slate-300 uppercase">
                    {applicant.full_name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-4 justify-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">Full Name</p>
                  <p className="font-bold text-lg text-ink leading-tight">{applicant.full_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">Date of Birth</p>
                    <p className="font-medium text-sm text-ink">{applicant.date_of_birth}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">Gender</p>
                    <p className="font-medium text-sm capitalize text-ink">{applicant.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-0.5">Occupation Applied</p>
                    <p className="font-medium text-sm text-ink bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{applicant.occupation_applied || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable contact fields */}
            <div className="pt-5 border-t border-slate-100">
              <ProfileEditor
                applicantId={applicant.id}
                cellphone={applicant.cellphone_number}
                email={applicant.email || ""}
                address={applicant.home_address || ""}
              />
            </div>
          </div>

          {/* 5. STATUS CARDS ROW */}
          <div className="break-inside-avoid w-full grid grid-cols-2 gap-4">
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center border border-white/50 group">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-navy opacity-80 group-hover:opacity-100 transition-opacity">Medical Status</p>
              <p className={`text-sm font-black uppercase ${applicant.medical_status === 'fit' ? 'text-green-600' : applicant.medical_status === 'unfit' ? 'text-red-600' : 'text-amber-600'}`}>
                {applicant.medical_status || "PENDING"}
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center border border-white/50 group">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5 text-navy opacity-80 group-hover:opacity-100 transition-opacity">PDOS Training</p>
              <p className={`text-sm font-black uppercase ${applicant.pdos_completed ? 'text-green-600' : 'text-amber-600'}`}>
                {applicant.pdos_completed ? "Completed" : "Pending"}
              </p>
            </div>
          </div>

          {/* 6. DMW & PEOS DETAILS */}
          <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/50">
            <p className="text-xs font-bold uppercase tracking-widest mb-5 text-navy">Compliance Status</p>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-1">DMW e-Registration #</p>
                <p className="text-sm font-bold text-ink">
                  {applicant.dmw_registration_number || <span className="text-amber-600 font-medium italic">Not yet registered</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-faint mb-1">PEOS Certificate</p>
                <p className={`text-sm font-bold uppercase ${applicant.peos_certificate_status === 'completed' ? 'text-green-600' : applicant.peos_certificate_status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'}`}>
                  {applicant.peos_certificate_status?.replace(/_/g, " ") || "Not Started"}
                </p>
              </div>
              <div className="col-span-2 mt-2">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">PEOS Modules</p>
                  <p className="text-xs font-bold text-ink-muted">{applicant.peos_modules_completed || 0} / 8 completed</p>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${i < (applicant.peos_modules_completed || 0) ? "bg-crimson shadow-sm" : "bg-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 7. SUBMITTED & VERIFIED DOCUMENTS */}
          <div className="break-inside-avoid w-full bg-white p-6 rounded-3xl border border-border shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-xs font-bold uppercase tracking-widest mb-5 text-navy">Document Status</p>
            {submittedDocs.length === 0 && verifiedDocs.length === 0 ? (
              <p className="text-sm text-center italic py-5 text-ink-faint">No documents submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {[...verifiedDocs, ...submittedDocs].map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center py-3 border-b border-border last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2">
                    <p className="text-sm font-medium text-ink">{doc.document_requirement?.doc_name || "Unknown Document"}</p>
                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-md shadow-sm ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 8. CONTACT THE OFFICE */}
          <div className="break-inside-avoid w-full bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/50 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-navy">Need Help?</p>
            <p className="text-sm mb-5 text-ink-muted">
              For questions about your application, contact our processing team.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="mailto:support@phil-apex.com"
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-navy border-navy/20 bg-navy/5 hover:bg-navy/10"
              >
                ✉️ Email Us
              </a>
              <a
                href="tel:+639XXXXXXXXX"
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-crimson border-crimson/20 bg-crimson/5 hover:bg-crimson/10"
              >
                📞 Call Us
              </a>
            </div>
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