"use client";

import { useState, useMemo } from "react";
import { LogoutButton } from "./logout-button";
import { DocumentUploader } from "./document-uploader";
import { ProfileEditor } from "./profile-editor";
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
  Search,
  Copy,
  Info,
  ChevronRight,
  Award,
} from "lucide-react";

type DocRequirement = {
  id: number;
  doc_name: string;
  requires_file_upload: boolean;
  is_conditional: boolean;
  condition_note: string | null;
};

type ApplicantDoc = {
  id: string;
  status: "missing" | "submitted" | "verified";
  file_path: string | null;
  remarks: string | null;
  document_requirement: DocRequirement | null;
};

type DeploymentInfo = {
  id: string;
  visa_status: string | null;
  oec_number: string | null;
  flight_airline: string | null;
  flight_number: string | null;
  departure_datetime: string | null;
  batch: {
    job_order: {
      id: string;
      program_name: string | null;
      trade_name: string | null;
      country: string | null;
      position: string | null;
      partner: { name: string } | null;
    } | null;
  } | null;
} | null;

type Props = {
  applicant: {
    id: string;
    reference_number: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    cellphone_number: string;
    email: string | null;
    home_address: string | null;
    educational_attainment: string | null;
    occupation_applied: string | null;
    has_passport: boolean;
    dmw_registration_number: string | null;
    peos_modules_completed: number;
    peos_certificate_status: string;
    current_pipeline_stage: string;
    medical_status: string | null;
    pdos_completed: boolean;
  };
  docs: ApplicantDoc[];
  deployment: DeploymentInfo;
  profilePictureUrl: string | null;
};

type TabType = "documents" | "compliance" | "deployment" | "profile";

export function ApplicantDashboardView({ applicant, docs, deployment, profilePictureUrl }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("documents");
  const [docFilter, setDocFilter] = useState<"all" | "missing" | "submitted" | "verified">("all");
  const [docSearch, setDocSearch] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Pipeline stages definition
  const stages = [
    { key: "registered", label: "Registered", Icon: UserCheck },
    { key: "documents_complete", label: "Docs Complete", Icon: FileCheck2 },
    { key: "dmw_registered", label: "DMW Registered", Icon: Building2 },
    { key: "peos_certified", label: "PEOS Certified", Icon: GraduationCap },
    { key: "matched", label: "Matched", Icon: Handshake },
    { key: "deployed", label: "Deployed", Icon: Plane },
  ];
  const currentStageIndex = stages.findIndex((s) => s.key === applicant.current_pipeline_stage);

  // Document metrics
  const missingDocs = useMemo(() => docs.filter((d) => d.status === "missing"), [docs]);
  const submittedDocs = useMemo(() => docs.filter((d) => d.status === "submitted"), [docs]);
  const verifiedDocs = useMemo(() => docs.filter((d) => d.status === "verified"), [docs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      // Filter by status tab
      if (docFilter === "missing" && doc.status !== "missing") return false;
      if (docFilter === "submitted" && doc.status !== "submitted") return false;
      if (docFilter === "verified" && doc.status !== "verified") return false;

      // Filter by search text
      if (docSearch.trim()) {
        const query = docSearch.toLowerCase();
        const docName = doc.document_requirement?.doc_name?.toLowerCase() || "";
        const remarks = doc.remarks?.toLowerCase() || "";
        return docName.includes(query) || remarks.includes(query);
      }

      return true;
    });
  }, [docs, docFilter, docSearch]);

  // Initials for avatar
  const initials = useMemo(() => {
    const parts = (applicant.full_name || "").trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] || "A").toUpperCase();
  }, [applicant.full_name]);

  const copyReference = () => {
    const text = applicant.reference_number || applicant.id;
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60 pb-10">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 space-y-4 flex-1 min-h-0">
        
        {/* ── 1. Compact Header Banner ─────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Applicant Identity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-primary/10 text-primary font-bold text-sm shrink-0 flex items-center justify-center shadow-xs">
                {profilePictureUrl && !imgError ? (
                  <img
                    src={profilePictureUrl}
                    alt={applicant.full_name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                    {applicant.full_name}
                  </h1>
                  
                  {/* Reference Pill with Copy */}
                  <button
                    type="button"
                    onClick={copyReference}
                    title="Click to copy reference number"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <span>{applicant.reference_number || applicant.id.slice(0, 8)}</span>
                    {copiedRef ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 opacity-60" />
                    )}
                  </button>

                  {/* Stage Pill */}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {applicant.current_pipeline_stage?.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-gray-600 mt-1 flex-wrap">
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    <span>{applicant.occupation_applied || "General Applicant"}</span>
                  </span>
                  <span>•</span>
                  <span>{applicant.cellphone_number}</span>
                  {applicant.email && (
                    <>
                      <span>•</span>
                      <span className="text-gray-500 truncate max-w-[220px]">{applicant.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics & Logout */}
            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center flex-wrap">
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 font-semibold ${
                  missingDocs.length > 0
                    ? "bg-amber-50/80 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                <span>{verifiedDocs.length}/{docs.length} Docs Verified</span>
                {missingDocs.length > 0 && (
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                    {missingDocs.length} Action Needed
                  </span>
                )}
              </div>

              <LogoutButton />
            </div>
          </div>
        </div>

        {/* ── 2. Sleek Connected Milestone Progress Bar (Slim, ~40px) ───── */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-xs">
          <div className="flex items-center justify-between overflow-x-auto gap-2 sm:gap-4 no-scrollbar">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isFuture = idx > currentStageIndex;

              return (
                <div key={stage.key} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[120px] last:flex-initial">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                        isPast
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-[11px] font-bold leading-tight truncate ${
                          isCurrent
                            ? "text-primary font-extrabold"
                            : isPast
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[9px] text-gray-400 leading-none mt-0.5">
                        {isPast ? "Done" : isCurrent ? "In Progress" : "Pending"}
                      </p>
                    </div>
                  </div>

                  {/* Connecting Line */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 min-w-[16px] rounded-full ${
                        isPast ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. Segmented Navigation Tabs ──────────────────────────────── */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Checklist</span>
            {missingDocs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {missingDocs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("compliance")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "compliance"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance & Training</span>
            {applicant.dmw_registration_number ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deployment")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "deployment"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Deployment Status</span>
            {deployment && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Matched
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-xl"
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile & Info</span>
          </button>
        </div>

        {/* ── 4. Tab Contents (No Infinite Scroll!) ─────────────────────── */}
        <div className="min-h-[420px]">
          
          {/* ════ TAB 1: DOCUMENTS CHECKLIST ════ */}
          {activeTab === "documents" && (
            <div className="space-y-4">
              {/* Filter Toolbar & Search */}
              <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Status Filter Chips */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setDocFilter("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      docFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All ({docs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocFilter("missing")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      docFilter === "missing"
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    Action Needed ({missingDocs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocFilter("submitted")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      docFilter === "submitted"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Submitted ({submittedDocs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocFilter("verified")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      docFilter === "verified"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Verified ({verifiedDocs.length})
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search documents…"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
                  />
                  {docSearch && (
                    <button
                      type="button"
                      onClick={() => setDocSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Information Alert */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Document Submission Guide:</strong> Documents marked <em>Upload</em> can be uploaded directly as JPG, PNG, or PDF files. For physical clearances and certificates, please submit original paper copies directly to the Phil-Apex Placement Agency Bacolod Office.
                </div>
              </div>

              {/* Documents 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDocs.length === 0 ? (
                  <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-500">
                    No documents matching the selected filter or search term.
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const isMissing = doc.status === "missing";
                    const isSubmitted = doc.status === "submitted";
                    const isVerified = doc.status === "verified";
                    const docReq = doc.document_requirement;

                    return (
                      <div
                        key={doc.id}
                        className={`bg-white border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs ${
                          isVerified
                            ? "border-emerald-200/80 bg-emerald-50/20"
                            : isSubmitted
                            ? "border-amber-200/80 bg-amber-50/20"
                            : "border-gray-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-900 leading-tight">
                                {docReq?.doc_name || "Document Requirement"}
                              </span>
                              {docReq?.is_conditional ? (
                                <span className="text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                                  {docReq.condition_note || "Conditional"}
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded">
                                  Mandatory
                                </span>
                              )}
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : isSubmitted
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>

                          {doc.remarks && (
                            <p className="text-[11px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                              Note: &ldquo;{doc.remarks}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Action Area */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                          {isMissing ? (
                            docReq?.requires_file_upload ? (
                              <DocumentUploader
                                documentId={doc.id}
                                docName={docReq?.doc_name || "Document"}
                              />
                            ) : (
                              <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Submit physical copy to office
                              </span>
                            )
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isVerified ? "Verified by Staff" : "File Submitted"}</span>
                              </span>
                              {docReq?.requires_file_upload && (
                                <DocumentUploader
                                  documentId={doc.id}
                                  docName={docReq?.doc_name || "Document"}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ════ TAB 2: COMPLIANCE & TRAINING ════ */}
          {activeTab === "compliance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* DMW E-Registration Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          DMW E-Registration
                        </h3>
                        <p className="text-[10px] text-gray-400">Department of Migrant Workers</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        applicant.dmw_registration_number
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {applicant.dmw_registration_number ? "Registered" : "Pending"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    All applicants for overseas employment are required to hold an active DMW E-Registration account and identification number.
                  </p>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 mb-4">
                    <p className="text-[10px] font-bold uppercase text-gray-400">Registration Number</p>
                    <p className="text-sm font-mono font-bold text-gray-900 mt-0.5">
                      {applicant.dmw_registration_number || <span className="text-amber-600 font-sans italic">Not yet submitted</span>}
                    </p>
                  </div>
                </div>

                <a
                  href="https://onlineservices.dmw.gov.ph/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold text-primary hover:bg-primary/5 transition-colors shadow-2xs"
                >
                  <span>Open DMW Online Services</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* PEOS Certification Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          PEOS Online Seminar
                        </h3>
                        <p className="text-[10px] text-gray-400">Pre-Employment Orientation</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        applicant.peos_modules_completed >= 8
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {applicant.peos_modules_completed >= 8 ? "Completed" : "In Progress"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="font-semibold text-gray-700">8 Modules Completion</span>
                    <span className="font-bold text-gray-900">
                      {applicant.peos_modules_completed || 0} / 8 Modules
                    </span>
                  </div>

                  {/* 8-step progress bar */}
                  <div className="grid grid-cols-8 gap-1 mb-4">
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

                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Complete the 8 free orientation modules on the DMW PEOS website and provide your certificate of completion to our staff.
                  </p>
                </div>

                <a
                  href="https://peos.dmw.gov.ph/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-bold text-primary hover:bg-primary/5 transition-colors shadow-2xs"
                >
                  <span>Open PEOS Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Medical Examination Status */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Medical Examination
                        </h3>
                        <p className="text-[10px] text-gray-400">DOH-Accredited Clinic</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        applicant.medical_status === "fit"
                          ? "bg-emerald-100 text-emerald-800"
                          : applicant.medical_status === "unfit"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {applicant.medical_status || "Pending"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Medical screening will be scheduled with an accredited clinic once your initial compliance documents are verified and you are shortlisted for interview.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                  <p className="font-semibold text-gray-900 mb-0.5">Clinic Referral Note</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Referral slips will be issued by Phil-Apex Bacolod office upon candidate endorsement.
                  </p>
                </div>
              </div>

              {/* PDOS Training Status */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          PDOS Training
                        </h3>
                        <p className="text-[10px] text-gray-400">Pre-Departure Orientation</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        applicant.pdos_completed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {applicant.pdos_completed ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    The mandatory Pre-Departure Orientation Seminar (PDOS) is conducted after contract signing and visa issuance prior to flight schedule confirmation.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                  <p className="font-semibold text-gray-900 mb-0.5">OWWA Certificate</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    PDOS certificate is required for issuance of Overseas Employment Certificate (OEC).
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ════ TAB 3: DEPLOYMENT STATUS ════ */}
          {activeTab === "deployment" && (
            <div>
              {deployment ? (
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-xs border-l-4 border-l-emerald-600">
                  <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active Deployment Match
                      </span>
                      <h2 className="text-base font-bold text-gray-900 mt-1">
                        {deployment.batch?.job_order?.position || deployment.batch?.job_order?.trade_name || "Assigned Position"}
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      ID: {deployment.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Employer Partner</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                        {deployment.batch?.job_order?.partner?.name || "Assigned Japanese Company"}
                      </p>
                      <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        {deployment.batch?.job_order?.country || "Japan"}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Program & Trade</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                        {deployment.batch?.job_order?.trade_name || "Technical Intern"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {deployment.batch?.job_order?.program_name || "Technical Intern Training Program"}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Visa & OEC Status</p>
                      <p
                        className={`text-xs sm:text-sm font-bold uppercase mt-0.5 ${
                          deployment.visa_status === "approved"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        Visa: {deployment.visa_status || "Processing"}
                      </p>
                      {deployment.oec_number && (
                        <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                          OEC: {deployment.oec_number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Flight Details if Available */}
                  {(deployment.flight_airline || deployment.flight_number) && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5">
                        <Plane className="w-5 h-5 text-emerald-700" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">
                            Flight: {deployment.flight_airline} {deployment.flight_number}
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            Departure: {deployment.departure_datetime || "Schedule to be announced"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center max-w-xl mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <Handshake className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Matching & Endorsement in Progress
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-5 max-w-md mx-auto">
                    Your application for <strong>{applicant.occupation_applied || "Japan Programs"}</strong> is currently registered in our database. Complete all required compliance documents to expedite your endorsement for interview with Japanese employers.
                  </p>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left text-xs space-y-2">
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Next Step: Complete your 18 document requirements</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span>Interview scheduling with foreign principal</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Contract signing, visa processing & departure</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 4: PROFILE & CONTACT DETAILS ════ */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Personal Details (7 cols) */}
              <div className="md:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                    Applicant Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Date of Birth</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{applicant.date_of_birth}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Gender</p>
                    <p className="font-semibold text-gray-900 mt-0.5 capitalize">{applicant.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Educational Attainment</p>
                    <p className="font-semibold text-gray-900 mt-0.5 truncate">
                      {applicant.educational_attainment || "High School Graduate"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Passport Status</p>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {applicant.has_passport ? "Valid Passport" : "No Passport"}
                    </p>
                  </div>
                </div>

                {/* Editable Contact Fields */}
                <ProfileEditor
                  applicantId={applicant.id}
                  cellphone={applicant.cellphone_number}
                  email={applicant.email || ""}
                  address={applicant.home_address || ""}
                />
              </div>

              {/* Support & Agency Info (5 cols) */}
              <div className="md:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Phil-Apex Placement Agency
                    </h3>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Have questions regarding your application or documents? Visit or contact our recruitment officers:
                  </p>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex items-center gap-2 text-gray-700 p-2 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>Bacolod City, Negros Occidental, Philippines</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 p-2 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>(+63) 432-6811</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 p-2 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span>philapexbacolod@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-[10px] text-gray-400">
                  <p className="font-semibold text-gray-600">DMW License: DMW-514-LB-08132024-R</p>
                  <p className="mt-0.5">Phil-Apex Placement Agency Inc. • No Placement Fee Policy</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
