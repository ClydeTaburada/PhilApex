import { redirect } from "next/navigation";
import { getApplicantSession } from "@/lib/applicant-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LogoutButton } from "./logout-button";
import { DocumentUploader } from "./document-uploader";
import { ProfileEditor } from "./profile-editor";
import { ChatWidget } from "@/components/chat-widget";
import {
  UserCheck,
  FileCheck2,
  Building2,
  GraduationCap,
  Handshake,
  Plane,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Check,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

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

  // Fetch Documents with Requirements
  const { data: docs } = await (supabase as any)
    .from("applicant_documents")
    .select(`
      id, status, file_path, remarks,
      document_requirement:document_requirements(id, doc_name, requires_file_upload, is_conditional, condition_note)
    `)
    .eq("applicant_id", session.applicant_id)
    .order("document_requirement_id", { ascending: true });

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
    // fallback if columns differ
  }

  const stages = [
    { key: "registered",         label: "Registered",      Icon: UserCheck },
    { key: "documents_complete", label: "Docs Complete",   Icon: FileCheck2 },
    { key: "dmw_registered",     label: "DMW Registered",  Icon: Building2 },
    { key: "peos_certified",     label: "PEOS Certified",  Icon: GraduationCap },
    { key: "matched",            label: "Matched",         Icon: Handshake },
    { key: "deployed",           label: "Deployed",        Icon: Plane },
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
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60 pb-12">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5 flex-1 min-h-0">
        
        {/* ── 1. Applicant Overview Banner ─────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Avatar & Key Details */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center shadow-xs">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt={applicant.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate">
                    {applicant.full_name}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    {applicant.reference_number ?? applicant.id.slice(0, 8)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {applicant.current_pipeline_stage?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
                  <span className="font-semibold text-gray-900 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>{applicant.occupation_applied || "General Applicant"}</span>
                  </span>
                  <span>•</span>
                  <span>{applicant.cellphone_number}</span>
                  {applicant.email && (
                    <>
                      <span>•</span>
                      <span className="text-gray-500 truncate max-w-[200px]">{applicant.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics & Logout */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 font-semibold ${
                missingDocs.length > 0 
                  ? "bg-red-50 text-red-700 border-red-200" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                <span>{verifiedDocs.length}/{(docs || []).length} Verified</span>
                {missingDocs.length > 0 && (
                  <span className="text-[10px] bg-red-200/80 text-red-800 px-1.5 py-0.2 rounded font-bold">
                    {missingDocs.length} missing
                  </span>
                )}
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* ── 2. Pipeline Progress Stepper ─────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4">
            Application Pipeline Milestones
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const StepIcon = stage.Icon;

              return (
                <div
                  key={stage.key}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    isCurrent
                      ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30"
                      : isPast
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-gray-50/60 border-gray-200 opacity-60"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-xs ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {stage.label}
                  </p>
                  <span className="text-[10px] font-semibold mt-1">
                    {isPast ? (
                      <span className="text-emerald-700">Completed</span>
                    ) : isCurrent ? (
                      <span className="text-primary font-bold">In Progress</span>
                    ) : (
                      <span className="text-gray-400">Upcoming</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Two-Column Dashboard Content ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Documents Checklist & Deployment (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Required Documents Checklist */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      Required Documents Checklist
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      Standard overseas compliance documentation requirements
                    </p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                  missingDocs.length === 0 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {missingDocs.length === 0 ? "All Documents Complete" : `${missingDocs.length} Pending Actions`}
                </span>
              </div>

              {/* Document rows */}
              <div className="divide-y divide-gray-100">
                {(docs || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No requirements records registered yet.
                  </div>
                ) : (
                  (docs || []).map((doc: any) => {
                    const isMissing = doc.status === "missing";
                    const isSubmitted = doc.status === "submitted";
                    const isVerified = doc.status === "verified";

                    return (
                      <div key={doc.id} className="p-3.5 sm:p-4 hover:bg-gray-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {doc.document_requirement?.doc_name || "Document Requirement"}
                            </span>
                            {doc.document_requirement?.is_conditional ? (
                              <span className="text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                                {doc.document_requirement.condition_note || "Conditional"}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>

                          {doc.remarks && (
                            <p className="text-[11px] text-gray-500 mt-1 italic">
                              Staff note: &ldquo;{doc.remarks}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isVerified
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isSubmitted
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {doc.status}
                          </span>

                          {isMissing ? (
                            doc.document_requirement?.requires_file_upload ? (
                              <DocumentUploader documentId={doc.id} docName={doc.document_requirement?.doc_name || "Document"} />
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium">
                                Submit physical copy to office
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>File Received</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Deployment Card (if matched/deployed) */}
            {deployment && (
              <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-l-emerald-600">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                  Active Deployment & Job Assignment
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-500">Employer</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                      {deployment.batch?.job_order?.partner?.name || "Assigned Partner"}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase mt-0.5">
                      {deployment.batch?.job_order?.country || "Japan"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-500">Trade & Position</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                      {deployment.batch?.job_order?.trade_name || deployment.batch?.job_order?.position || "—"}
                    </p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                      {deployment.batch?.job_order?.program_name || "Technical Intern Training"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-gray-500">Visa & OEC</p>
                    <p className={`text-xs sm:text-sm font-bold uppercase mt-0.5 ${
                      deployment.visa_status === 'approved' ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      Visa: {deployment.visa_status || 'In Progress'}
                    </p>
                    {deployment.oec_number && (
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">OEC: {deployment.oec_number}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Profile & Compliance Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Contact & Personal Info Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <User className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Profile & Contact Info
                </h3>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Date of Birth</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{applicant.date_of_birth}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Gender</p>
                  <p className="font-semibold text-gray-900 mt-0.5 capitalize">{applicant.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Education</p>
                  <p className="font-semibold text-gray-900 mt-0.5 truncate">{applicant.educational_attainment || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Passport Status</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{applicant.has_passport ? "Valid Passport" : "No Passport"}</p>
                </div>
              </div>

              {/* Editable Contacts */}
              <ProfileEditor
                applicantId={applicant.id}
                cellphone={applicant.cellphone_number}
                email={applicant.email || ""}
                address={applicant.home_address || ""}
              />
            </div>

            {/* Compliance & Training Status */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Compliance & Certifications
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">DMW Registration #</p>
                    <p className="font-mono font-bold text-gray-900 mt-0.5">
                      {applicant.dmw_registration_number || <span className="text-amber-600 font-sans italic font-normal">Pending</span>}
                    </p>
                  </div>
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Medical Examination</p>
                    <p className={`font-bold mt-0.5 uppercase ${
                      applicant.medical_status === 'fit' ? 'text-emerald-700' : applicant.medical_status === 'unfit' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {applicant.medical_status || "PENDING"}
                    </p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    applicant.medical_status === 'fit' ? 'bg-emerald-500' : applicant.medical_status === 'unfit' ? 'bg-red-500' : 'bg-amber-400'
                  }`} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">PDOS Training</p>
                    <p className={`font-bold mt-0.5 uppercase ${applicant.pdos_completed ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {applicant.pdos_completed ? "Completed" : "Pending"}
                    </p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${applicant.pdos_completed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                </div>

                {/* PEOS Progress */}
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] font-bold uppercase text-gray-400">PEOS Modules</p>
                    <span className="text-[11px] font-bold text-gray-900">
                      {applicant.peos_modules_completed || 0} / 8 Completed
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1 mt-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i < (applicant.peos_modules_completed || 0)
                            ? "bg-primary"
                            : "bg-gray-200"
                        }`}
                        title={`Module ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance / Processing Office Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm text-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
                Need Help with Requirements?
              </h3>
              <p className="text-[11px] text-gray-500 mb-3">
                Our recruitment officers are available to guide you through your application.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="tel:+634326811"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Call Us: (+63) 432-6811</span>
                </a>
                <a
                  href="mailto:philapexbacolod@gmail.com"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Email: philapexbacolod@gmail.com</span>
                </a>
              </div>
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