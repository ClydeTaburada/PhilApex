"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { 
  FileCheck2, 
  Settings2, 
  Plane, 
  User, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter,
  FileText,
  ShieldCheck,
  Check,
  Building2
} from "lucide-react";
import type { StaffRole } from "@/lib/schemas";
import type { ApplicantDetail, ApplicantDocumentDetail, InsuranceRecord } from "@/lib/data/applicant-detail";
import type { JobOrderRow } from "@/lib/data/job-orders";

type Props = {
  applicant: ApplicantDetail;
  documents: ApplicantDocumentDetail[];
  insurance?: InsuranceRecord[];
  deployment?: any;
  jobOrders?: JobOrderRow[];
  staffRole: StaffRole;
};

type DocStatus = "missing" | "submitted" | "verified";

type TabKey = "requirements" | "processing" | "deployment" | "profile" | "all";

const PIPELINE_STAGES = [
  { value: "registered",         label: "Registered"        },
  { value: "documents_complete", label: "Documents Complete" },
  { value: "dmw_registered",     label: "DMW Registered"    },
  { value: "peos_certified",     label: "PEOS Certified"    },
  { value: "matched",            label: "Matched"           },
  { value: "deployed",           label: "Deployed"          },
] as const;

const PEOS_STATUSES = [
  { value: "not_started",  label: "Not Started"  },
  { value: "in_progress",  label: "In Progress"  },
  { value: "completed",    label: "Completed"    },
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

function useSaveState() {
  const [state, setState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const save = useCallback(
    async (url: string, body: unknown, onSuccess?: () => void) => {
      setState("saving");
      setErrorMsg(null);
      try {
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setErrorMsg(payload.error ?? "Unable to save changes");
          setState("error");
          return false;
        }
        setState("saved");
        onSuccess?.();
        setTimeout(() => setState("idle"), 2000);
        return true;
      } catch {
        setErrorMsg("Network error. Please try again.");
        setState("error");
        return false;
      }
    },
    [],
  );

  return { state, errorMsg, save };
}

function SaveButton({
  state,
  label,
  onClick,
}: {
  state: SaveState;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "saving"}
      className={`w-full mt-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm ${
        state === "saved"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
          : state === "error"
          ? "bg-red-50 text-red-700 border border-red-300"
          : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
      }`}
    >
      {state === "saving" ? (
        <>
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving…
        </>
      ) : state === "saved" ? (
        "✓ Saved"
      ) : (
        label
      )}
    </button>
  );
}

export function ApplicantDetailPanel({ 
  applicant, 
  documents, 
  insurance = [], 
  deployment, 
  jobOrders, 
  staffRole 
}: Props) {
  // Active Tab - Default is "requirements" so the user immediately sees the checklist!
  const [activeTab, setActiveTab] = useState<TabKey>("requirements");

  // Save states
  const pipelineSave = useSaveState();
  const jobOrderSave = useSaveState();
  const dmwSave = useSaveState();
  const peosSave = useSaveState();
  const medicalSave = useSaveState();
  const pdosSave = useSaveState();

  // File viewing error
  const [viewFileError, setViewFileError] = useState<string | null>(null);

  // Filter & Search inside requirements
  const [reqFilter, setReqFilter] = useState<"all" | "missing" | "submitted" | "verified">("all");
  const [reqSearch, setReqSearch] = useState("");

  // Optimistic local states
  const [pipelineStage, setPipelineStage] = useState(applicant.current_pipeline_stage);
  const [dmwNumber, setDmwNumber] = useState(applicant.dmw_registration_number ?? "");
  const [peosStatus, setPeosStatus] = useState(applicant.peos_certificate_status);
  const [medicalStatus, setMedicalStatus] = useState(applicant.medical_status || "pending");
  const [pdosCompleted, setPdosCompleted] = useState(applicant.pdos_completed || false);
  const [moduleChecks, setModuleChecks] = useState<boolean[]>(
    Array.from({ length: 8 }, (_, i) => i < applicant.peos_modules_completed),
  );
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(
    Object.fromEntries(documents.map((d) => [d.id, d.status as DocStatus])),
  );
  const [docRemarks, setDocRemarks] = useState<Record<string, string>>(
    Object.fromEntries(documents.map((d) => [d.id, d.remarks ?? ""])),
  );
  const [photo2x2Url, setPhoto2x2Url] = useState<string | null>(null);
  const [assignedJobOrder, setAssignedJobOrder] = useState<string>(
    applicant.assigned_job_order_id ?? "",
  );

  const moduleCount = useMemo(() => moduleChecks.filter(Boolean).length, [moduleChecks]);

  const photo2x2Document = useMemo(
    () => documents.find((d) => d.document_requirement.doc_name === "2x2 ID Photo"),
    [documents],
  );

  // Requirements status stats
  const reqStats = useMemo(() => {
    let missing = 0;
    let submitted = 0;
    let verified = 0;
    for (const doc of documents) {
      const st = docStatuses[doc.id] ?? doc.status;
      if (st === "verified") verified++;
      else if (st === "submitted") submitted++;
      else missing++;
    }
    return {
      total: documents.length,
      missing,
      submitted,
      verified,
    };
  }, [documents, docStatuses]);

  // Filtered requirements list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const st = docStatuses[doc.id] ?? doc.status;
      if (reqFilter !== "all" && st !== reqFilter) return false;
      if (reqSearch.trim()) {
        const query = reqSearch.toLowerCase();
        const docName = doc.document_requirement.doc_name.toLowerCase();
        const note = (doc.document_requirement.condition_note ?? "").toLowerCase();
        const remarks = (docRemarks[doc.id] ?? "").toLowerCase();
        return docName.includes(query) || note.includes(query) || remarks.includes(query);
      }
      return true;
    });
  }, [documents, docStatuses, docRemarks, reqFilter, reqSearch]);

  // Load 2x2 Photo URL
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!photo2x2Document?.file_path) {
        setPhoto2x2Url(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/staff/files/sign?path=${encodeURIComponent(photo2x2Document.file_path)}`,
          { cache: "no-store" },
        );
        const payload = (await res.json()) as { data?: { signedUrl: string } };
        if (!cancelled && payload.data?.signedUrl) {
          setPhoto2x2Url(payload.data.signedUrl);
        }
      } catch {
        if (!cancelled) setPhoto2x2Url(null);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [photo2x2Document?.file_path]);

  const onViewFile = async (filePath: string) => {
    setViewFileError(null);
    try {
      const res = await fetch(
        `/api/staff/files/sign?path=${encodeURIComponent(filePath)}`,
        { cache: "no-store" },
      );
      const payload = (await res.json()) as { data?: { signedUrl: string }; error?: string };
      if (payload.data?.signedUrl) {
        window.open(payload.data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        setViewFileError("Unable to open file. Please try again or contact support.");
      }
    } catch {
      setViewFileError("Network error. Could not retrieve file link.");
    }
  };

  const updateDocumentStatus = async (documentId: string, newStatus: DocStatus) => {
    setDocStatuses((prev) => ({ ...prev, [documentId]: newStatus }));
    const ok = await pipelineSave.save(
      `/api/staff/applicants/${applicant.id}/documents/${documentId}`,
      { status: newStatus },
    );
    if (!ok) {
      setDocStatuses((prev) => ({
        ...prev,
        [documentId]: (documents.find((d) => d.id === documentId)?.status as DocStatus) ?? "missing",
      }));
    }
  };

  const updateDocumentRemarks = async (documentId: string, newRemarks: string) => {
    const ok = await pipelineSave.save(
      `/api/staff/applicants/${applicant.id}/documents/${documentId}`,
      { remarks: newRemarks },
    );
    if (!ok) {
      setDocRemarks((prev) => ({
        ...prev,
        [documentId]: documents.find((d) => d.id === documentId)?.remarks ?? "",
      }));
    }
  };

  const infoRows = [
    { label: "Reference ID", value: applicant.reference_number ?? applicant.id.slice(0, 8) + "…" },
    { label: "Full Name",  value: applicant.full_name },
    { label: "Date of Birth",  value: applicant.date_of_birth },
    { label: "Gender",  value: applicant.gender },
    { label: "Cellphone",  value: applicant.cellphone_number },
    { label: "Email",  value: applicant.email ?? "—" },
    { label: "Address",  value: applicant.home_address ?? "—" },
    { label: "Education",  value: applicant.educational_attainment ?? "—" },
    { label: "Occupation Applied",  value: applicant.occupation_applied ?? "—" },
    { label: "Has Passport?",  value: applicant.has_passport ? "Yes" : "No" },
    { label: "Source",  value: applicant.source?.replace(/_/g, " ") },
    { label: "Applied On",  value: new Date(applicant.created_at).toLocaleDateString() },
  ];

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
      {/* ── 1. Compact Applicant Summary Banner ───────────────────────── */}
      <div className="shrink-0 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Avatar & Key Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 flex items-center justify-center shadow-xs">
              {photo2x2Url ? (
                <img
                  src={photo2x2Url}
                  alt={applicant.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                  {applicant.full_name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {applicant.reference_number ?? applicant.id.slice(0, 8)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {pipelineStage.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {applicant.occupation_applied || "No trade specified"}
                </span>
                <span>•</span>
                <span>{applicant.cellphone_number}</span>
                {applicant.email && (
                  <>
                    <span>•</span>
                    <span className="text-gray-500 truncate max-w-[180px]">{applicant.email}</span>
                  </>
                )}
                {applicant.home_address && (
                  <>
                    <span>•</span>
                    <span className="text-gray-500 truncate max-w-[160px]">{applicant.home_address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 ${
              reqStats.missing > 0 
                ? "bg-red-50 text-red-700 border-red-200 font-semibold" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
            }`}>
              <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
              <span>{reqStats.verified}/{reqStats.total} Verified</span>
              {reqStats.missing > 0 && (
                <span className="text-[10px] bg-red-200/70 text-red-800 px-1 rounded">
                  {reqStats.missing} missing
                </span>
              )}
            </div>

            <div className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>PEOS: <strong>{moduleCount}/8</strong></span>
            </div>

            <div className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                medicalStatus === 'fit' ? 'bg-emerald-500' : medicalStatus === 'unfit' ? 'bg-red-500' : 'bg-amber-400'
              }`} />
              <span className="capitalize">{medicalStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Primary Navigation Tabs ─────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("requirements")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "requirements"
              ? "bg-white text-primary shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          }`}
        >
          <FileCheck2 className={`w-4 h-4 ${activeTab === "requirements" ? "text-primary" : "text-gray-400"}`} />
          <span>Applicant Requirements</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            reqStats.missing > 0 
              ? "bg-red-100 text-red-700" 
              : "bg-emerald-100 text-emerald-700"
          }`}>
            {reqStats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("processing")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "processing"
              ? "bg-white text-primary shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          }`}
        >
          <Settings2 className={`w-4 h-4 ${activeTab === "processing" ? "text-primary" : "text-gray-400"}`} />
          <span>Processing Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("deployment")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "deployment"
              ? "bg-white text-primary shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          }`}
        >
          <Plane className={`w-4 h-4 ${activeTab === "deployment" ? "text-primary" : "text-gray-400"}`} />
          <span>Deployment & Insurance</span>
          {deployment && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === "profile"
              ? "bg-white text-primary shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          }`}
        >
          <User className={`w-4 h-4 ${activeTab === "profile" ? "text-primary" : "text-gray-400"}`} />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-white text-primary shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
          }`}
          title="View all sections vertically"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* ── 3. Main Dynamic Content Area (Strictly Scrollable Interior) ─ */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-4">
        {/* TAB 1: APPLICANT REQUIREMENTS (Checklist & Documents Table) */}
        {(activeTab === "requirements" || activeTab === "all") && (
          <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Table Header & Controls */}
            <div className="p-3.5 border-b border-gray-200 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-tight">
                    Applicant Requirements Checklist
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    18 standard Philippine Overseas Employment compliance documents
                  </p>
                </div>
              </div>

              {/* Status Filter Pills & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[170px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search requirement…"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center bg-gray-200/60 p-0.5 rounded-lg border border-gray-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReqFilter("all")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      reqFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    All ({reqStats.total})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqFilter("missing")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      reqFilter === "missing" ? "bg-red-50 text-red-700 shadow-xs font-bold" : "text-gray-600 hover:text-red-700"
                    }`}
                  >
                    Missing ({reqStats.missing})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqFilter("submitted")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      reqFilter === "submitted" ? "bg-amber-50 text-amber-700 shadow-xs font-bold" : "text-gray-600 hover:text-amber-700"
                    }`}
                  >
                    Submitted ({reqStats.submitted})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReqFilter("verified")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      reqFilter === "verified" ? "bg-emerald-50 text-emerald-700 shadow-xs font-bold" : "text-gray-600 hover:text-emerald-700"
                    }`}
                  >
                    Verified ({reqStats.verified})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Requirement / Document</th>
                    <th className="px-4 py-2.5">Condition</th>
                    <th className="px-4 py-2.5">Current Status</th>
                    <th className="px-4 py-2.5">Update Status</th>
                    <th className="px-4 py-2.5">Staff Remarks</th>
                    <th className="px-4 py-2.5 text-right">File Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No requirements found matching &ldquo;{reqSearch}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const currentStatus = docStatuses[doc.id] ?? (doc.status as DocStatus);
                      const isVerified = currentStatus === "verified";
                      const cantChange = staffRole === "front_desk" && isVerified;

                      return (
                        <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                          {/* Document Name */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="font-semibold text-gray-900">
                                {doc.document_requirement.doc_name}
                              </span>
                              {doc.document_requirement.requires_file_upload && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200">
                                  File Required
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Condition */}
                          <td className="px-4 py-2.5">
                            {doc.document_requirement.is_conditional ? (
                              <span className="px-2 py-0.5 text-[10px] rounded font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                {doc.document_requirement.condition_note ?? "Conditional"}
                              </span>
                            ) : (
                              <span className="text-[11px] text-gray-500">
                                Mandatory
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-2.5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              currentStatus === "verified"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : currentStatus === "submitted"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {currentStatus}
                            </span>
                          </td>

                          {/* Status Quick Changer */}
                          <td className="px-4 py-2.5">
                            {!cantChange ? (
                              <select
                                value={currentStatus}
                                className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 bg-white focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                                onChange={(e) =>
                                  void updateDocumentStatus(doc.id, e.target.value as DocStatus)
                                }
                                disabled={pipelineSave.state === "saving" || cantChange}
                              >
                                <option value="missing">Missing</option>
                                <option value="submitted">Submitted</option>
                                {staffRole !== "front_desk" && (
                                  <option value="verified">Verified</option>
                                )}
                              </select>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">
                                Verified (Locked)
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50/50 w-full max-w-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Add staff remarks…"
                              value={docRemarks[doc.id] || ""}
                              onChange={(e) => setDocRemarks((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                              onBlur={() => updateDocumentRemarks(doc.id, docRemarks[doc.id])}
                              disabled={cantChange}
                            />
                          </td>

                          {/* File */}
                          <td className="px-4 py-2.5 text-right">
                            {doc.file_path ? (
                              <button
                                type="button"
                                onClick={() => void onViewFile(doc.file_path as string)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                              >
                                <span>View File</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                No file uploaded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROCESSING CONTROLS */}
        {(activeTab === "processing" || activeTab === "all") && (
          <div className="border border-gray-200 bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Settings2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Processing & Pipeline Controls
                </h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Pipeline stage */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-pipeline">
                  Pipeline Stage
                </label>
                <select
                  id="ctrl-pipeline"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  value={pipelineStage}
                  onChange={(e) => setPipelineStage(e.target.value as typeof pipelineStage)}
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <SaveButton
                  state={pipelineSave.state}
                  label="Save Stage"
                  onClick={() =>
                    void pipelineSave.save(`/api/staff/applicants/${applicant.id}/pipeline`, {
                      current_pipeline_stage: pipelineStage,
                    })
                  }
                />
                {pipelineSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{pipelineSave.errorMsg}</span>
                )}
              </div>

              {/* Job Order Assignment */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-job-order">
                  Assigned Job Order
                </label>
                <select
                  id="ctrl-job-order"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  value={assignedJobOrder}
                  onChange={(e) => setAssignedJobOrder(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {jobOrders?.map((jo) => (
                    <option key={jo.id} value={jo.id}>
                      {jo.trade} — {jo.country} ({jo.program_name})
                    </option>
                  ))}
                </select>
                <SaveButton
                  state={jobOrderSave.state}
                  label="Save Assignment"
                  onClick={() =>
                    void jobOrderSave.save(`/api/staff/applicants/${applicant.id}/job-order`, {
                      job_order_id: assignedJobOrder || null,
                    })
                  }
                />
                {jobOrderSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{jobOrderSave.errorMsg}</span>
                )}
              </div>

              {/* DMW Number */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-dmw">
                  DMW Registration Number
                </label>
                <input
                  id="ctrl-dmw"
                  value={dmwNumber}
                  onChange={(e) => setDmwNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="DMW-XXXXXXXX"
                />
                <SaveButton
                  state={dmwSave.state}
                  label="Save DMW #"
                  onClick={() =>
                    void dmwSave.save(`/api/staff/applicants/${applicant.id}/dmw`, {
                      dmw_registration_number: dmwNumber,
                    })
                  }
                />
                {dmwSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{dmwSave.errorMsg}</span>
                )}
              </div>

              {/* PEOS */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-peos">
                  PEOS Certificate Status
                </label>
                <select
                  id="ctrl-peos"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  value={peosStatus}
                  onChange={(e) => setPeosStatus(e.target.value as typeof peosStatus)}
                >
                  {PEOS_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <div className="mt-1">
                  <p className="text-[11px] font-semibold text-gray-600 mb-1">
                    Modules completed: <strong className="text-gray-900">{moduleCount}/8</strong>
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {moduleChecks.map((checked, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-1 text-[11px] cursor-pointer select-none font-medium text-gray-600"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setModuleChecks((prev) => {
                              const next = [...prev];
                              next[i] = e.target.checked;
                              return next;
                            })
                          }
                          className="accent-primary rounded"
                        />
                        M{i + 1}
                      </label>
                    ))}
                  </div>
                </div>
                <SaveButton
                  state={peosSave.state}
                  label="Save PEOS"
                  onClick={() =>
                    void peosSave.save(`/api/staff/applicants/${applicant.id}/peos`, {
                      peos_modules_completed: moduleCount,
                      peos_certificate_status: peosStatus,
                    })
                  }
                />
                {peosSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{peosSave.errorMsg}</span>
                )}
              </div>

              {/* Medical Status */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-medical">
                  Medical Examination Status
                </label>
                <select
                  id="ctrl-medical"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  value={medicalStatus}
                  onChange={(e) => setMedicalStatus(e.target.value as any)}
                >
                  <option value="pending">Pending</option>
                  <option value="fit">Fit to Work</option>
                  <option value="unfit">Unfit</option>
                </select>
                <SaveButton
                  state={medicalSave.state}
                  label="Save Medical"
                  onClick={() =>
                    void medicalSave.save(`/api/staff/applicants/${applicant.id}/pipeline`, {
                      medical_status: medicalStatus,
                    })
                  }
                />
                {medicalSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{medicalSave.errorMsg}</span>
                )}
              </div>

              {/* PDOS Status */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <label className="text-[11px] font-semibold text-gray-700" htmlFor="ctrl-pdos">
                  PDOS Training
                </label>
                <select
                  id="ctrl-pdos"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  value={pdosCompleted ? "true" : "false"}
                  onChange={(e) => setPdosCompleted(e.target.value === "true")}
                >
                  <option value="false">Pending</option>
                  <option value="true">Completed</option>
                </select>
                <SaveButton
                  state={pdosSave.state}
                  label="Save PDOS"
                  onClick={() =>
                    void pdosSave.save(`/api/staff/applicants/${applicant.id}/pipeline`, {
                      pdos_completed: pdosCompleted,
                    })
                  }
                />
                {pdosSave.errorMsg && (
                  <span className="text-[11px] text-red-600 font-medium" role="alert">{pdosSave.errorMsg}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPLOYMENT & INSURANCE */}
        {(activeTab === "deployment" || activeTab === "all") && (
          <div className="space-y-4">
            {/* Active Deployment */}
            {deployment ? (
              <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 sm:p-5 border-l-4 border-l-emerald-600 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                  Active Deployment Record
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employer / Partner</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">{deployment.batch?.job_order?.partner?.name || "—"}</p>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase mt-0.5">{deployment.batch?.job_order?.country}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Program & Trade</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">{deployment.batch?.job_order?.trade_name || "—"}</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">{deployment.batch?.job_order?.program_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Visa Status</p>
                    <p className={`text-xs sm:text-sm font-bold mt-0.5 uppercase ${deployment.visa_status === 'approved' ? 'text-emerald-700' : deployment.visa_status === 'denied' ? 'text-red-700' : 'text-amber-700'}`}>
                      {deployment.visa_status || 'PENDING'}
                    </p>
                    {deployment.oec_number && <p className="text-[10px] font-mono text-gray-500 mt-0.5">OEC: {deployment.oec_number}</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Flight Schedule</p>
                    {(deployment.flight_airline || deployment.flight_number) ? (
                      <>
                        <p className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">{deployment.flight_airline} {deployment.flight_number}</p>
                        {deployment.departure_datetime && (
                          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(deployment.departure_datetime).toLocaleString()}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs font-medium text-gray-400 mt-0.5">—</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-100 flex justify-end">
                  <Link href={`/staff/job-orders-v2/${deployment.batch?.job_order?.id}/batches`} className="text-xs font-bold text-emerald-700 hover:underline">
                    Manage in Batches →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 bg-white rounded-xl p-6 text-center shadow-xs">
                <Plane className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700">No Active Deployment</p>
                <p className="text-[11px] text-gray-400 mt-0.5">This applicant has not been deployed to an active job batch yet.</p>
              </div>
            )}

            {/* Smart Matches */}
            {jobOrders && jobOrders.length > 0 && applicant.occupation_applied && (
              <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 sm:p-5 border-l-4 border-l-primary shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Smart Matches for Trade</p>
                {(() => {
                  const matches = jobOrders.filter(jo => 
                    jo.trade?.toLowerCase().includes(applicant.occupation_applied!.toLowerCase()) ||
                    applicant.occupation_applied!.toLowerCase().includes(jo.trade?.toLowerCase() || "")
                  );
                  
                  if (matches.length === 0) {
                    return <p className="text-xs text-gray-500">No active job orders match &ldquo;{applicant.occupation_applied}&rdquo;.</p>;
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {matches.map(jo => (
                        <div key={jo.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:border-primary/40 transition-all shadow-xs">
                          <p className="text-xs font-bold text-gray-900">{jo.trade}</p>
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">{jo.country} • {jo.program_name}</p>
                          <button 
                            type="button"
                            onClick={() => {
                              setAssignedJobOrder(jo.id);
                              setActiveTab("processing");
                            }}
                            className="mt-2 text-[11px] font-bold text-primary uppercase tracking-wider hover:underline"
                          >
                            Assign this Job Order →
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Insurance Records */}
            <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <p className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Mandatory OFW Insurance Tracking ({insurance.length})
                </p>
              </div>
              <div className="overflow-x-auto">
                {insurance.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No insurance records found for this applicant.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Provider</th>
                        <th className="px-4 py-2.5">Policy No.</th>
                        <th className="px-4 py-2.5">Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {insurance.map((ins) => (
                        <tr key={ins.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{ins.insurance_type}</td>
                          <td className="px-4 py-2.5 text-gray-700">{ins.provider || "—"}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-600">{ins.policy_number || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {ins.coverage_start_date || "?"} to {ins.coverage_end_date || "?"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE DETAILS */}
        {(activeTab === "profile" || activeTab === "all") && (
          <div className="border border-gray-200 bg-white rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Photo */}
              <div className="flex flex-col gap-2 items-start md:w-[170px] shrink-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">2×2 ID Photo</p>
                <div className="w-full md:w-[170px] h-[200px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shadow-xs">
                  {photo2x2Url ? (
                    <img
                      src={photo2x2Url}
                      alt={`${applicant.full_name} 2x2 ID`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-center px-3 text-gray-400">
                      No photo uploaded
                    </span>
                  )}
                </div>
                {photo2x2Document?.file_path && (
                  <button
                    type="button"
                    onClick={() => void onViewFile(photo2x2Document.file_path as string)}
                    className="w-full py-1.5 px-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 flex items-center justify-center gap-1"
                  >
                    <span>Open Full Image</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Info grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {infoRows.map((row) => (
                  <div key={row.label} className="border-b border-gray-50 pb-1.5 last:border-b-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {row.label}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold mt-0.5 text-gray-900 truncate">
                      {row.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* File view error */}
        {viewFileError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg" role="alert">
            {viewFileError}
          </div>
        )}
      </div>
    </div>
  );
}
