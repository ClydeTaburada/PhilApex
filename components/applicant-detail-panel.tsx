"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import type { StaffRole } from "@/lib/schemas";
import type { ApplicantDetail, ApplicantDocumentDetail } from "@/lib/data/applicant-detail";
import type { JobOrderRow } from "@/lib/data/job-orders";

type Props = {
  applicant: ApplicantDetail;
  documents: ApplicantDocumentDetail[];
  jobOrders?: JobOrderRow[];
  staffRole: StaffRole;
};

type DocStatus = "missing" | "submitted" | "verified";

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

const DOC_STATUS_CONFIG: Record<DocStatus, { badgeClass: string; label: string }> = {
  missing:   { badgeClass: "badge badge-red",   label: "Missing"   },
  submitted: { badgeClass: "badge badge-amber",  label: "Submitted" },
  verified:  { badgeClass: "badge badge-green",  label: "Verified"  },
};

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
        // Reset to idle after 2s
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
      className={`btn btn-sm ${state === "saved" ? "btn-ghost" : "btn-primary"}`}
      style={state === "saved" ? { color: "var(--green)", borderColor: "var(--green-lt)", background: "var(--green-lt)" } : undefined}
    >
      {state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : label}
    </button>
  );
}

export function ApplicantDetailPanel({ applicant, documents, jobOrders, staffRole }: Props) {
  // Each control gets its own save state so they don't interfere (BUG-4)
  const pipelineSave = useSaveState();
  const jobOrderSave = useSaveState();
  const dmwSave = useSaveState();
  const peosSave = useSaveState();

  // Separate state for file-view errors (BUG-3)
  const [viewFileError, setViewFileError] = useState<string | null>(null);

  // Local optimistic state — no router.refresh() needed
  const [pipelineStage, setPipelineStage] = useState(applicant.current_pipeline_stage);
  const [dmwNumber, setDmwNumber] = useState(applicant.dmw_registration_number ?? "");
  const [peosStatus, setPeosStatus] = useState(applicant.peos_certificate_status);
  const [moduleChecks, setModuleChecks] = useState<boolean[]>(
    Array.from({ length: 8 }, (_, i) => i < applicant.peos_modules_completed),
  );
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>(
    Object.fromEntries(documents.map((d) => [d.id, d.status as DocStatus])),
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

  // Load photo
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
    // Optimistically update UI
    setDocStatuses((prev) => ({ ...prev, [documentId]: newStatus }));
    const ok = await pipelineSave.save(
      `/api/staff/applicants/${applicant.id}/documents/${documentId}`,
      { status: newStatus },
    );
    if (!ok) {
      // Revert on failure
      setDocStatuses((prev) => ({ ...prev, [documentId]: documents.find((d) => d.id === documentId)?.status as DocStatus ?? "missing" }));
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
    { label: "Source",  value: applicant.source?.replace(/_/g, " ") },
  ];

  return (
    <div className="space-y-5">
      {/* ── Profile Card ─────────────────────────────── */}
      <div className="card rounded-xl p-5">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Photo */}
          <div className="flex flex-col gap-2 items-start md:w-[160px] shrink-0">
            <p className="section-title">2×2 ID Photo</p>
            <div
              className="w-full md:w-[160px] h-[190px] rounded-xl overflow-hidden border flex items-center justify-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {photo2x2Url ? (
                <img
                  src={photo2x2Url}
                  alt={`${applicant.full_name} 2x2 ID`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-center px-3" style={{ color: "var(--ink-faint)" }}>
                  No photo uploaded
                </span>
              )}
            </div>
            {photo2x2Document?.file_path ? (
              <button
                type="button"
                onClick={() => void onViewFile(photo2x2Document.file_path as string)}
                className="btn btn-ghost btn-sm w-full"
              >
                Open Full Image
              </button>
            ) : null}
          </div>

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {infoRows.map((row) => (
              <div key={row.label}>
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                  {row.label}
                </p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--ink)" }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Processing Controls ───────────────────────── */}
      <div className="card rounded-xl p-5">
        <p className="section-title mb-4">Processing Controls</p>
        <div className="grid gap-5 md:grid-cols-3">
          {/* Pipeline stage */}
          <div className="form-field">
            <label className="form-label" htmlFor="ctrl-pipeline">Pipeline Stage</label>
            <select
              id="ctrl-pipeline"
              className="form-select"
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
              <span className="form-error" role="alert">{pipelineSave.errorMsg}</span>
            )}
          </div>

          {/* Job Order Assignment */}
          <div className="form-field">
            <label className="form-label" htmlFor="ctrl-job-order">Assigned Job Order</label>
            <select
              id="ctrl-job-order"
              className="form-select"
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
              <span className="form-error" role="alert">{jobOrderSave.errorMsg}</span>
            )}
          </div>

          {/* DMW Number */}
          <div className="form-field">
            <label className="form-label" htmlFor="ctrl-dmw">DMW Registration Number</label>
            <input
              id="ctrl-dmw"
              value={dmwNumber}
              onChange={(e) => setDmwNumber(e.target.value)}
              className="form-input"
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
              <span className="form-error" role="alert">{dmwSave.errorMsg}</span>
            )}
          </div>

          {/* PEOS */}
          <div className="form-field">
            <label className="form-label" htmlFor="ctrl-peos">PEOS Certificate Status</label>
            <select
              id="ctrl-peos"
              className="form-select"
              value={peosStatus}
              onChange={(e) => setPeosStatus(e.target.value as typeof peosStatus)}
            >
              {PEOS_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--ink-muted)" }}>
                Modules completed: <strong style={{ color: "var(--ink)" }}>{moduleCount}/8</strong>
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {moduleChecks.map((checked, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
                    style={{ color: checked ? "var(--green)" : "var(--ink-muted)" }}
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
                      className="accent-green-600"
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
              <span className="form-error" role="alert">{peosSave.errorMsg}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Documents Table ───────────────────────────── */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
            Required Documents
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Condition</th>
                <th>Status</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const currentStatus = docStatuses[doc.id] ?? (doc.status as DocStatus);
                const statusConfig = DOC_STATUS_CONFIG[currentStatus] ?? DOC_STATUS_CONFIG.missing;
                const isVerified = currentStatus === "verified";
                const cantChange = staffRole === "front_desk" && isVerified;

                return (
                  <tr key={doc.id}>
                    <td>
                      <span className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                        {doc.document_requirement.doc_name}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                        {doc.document_requirement.is_conditional
                          ? doc.document_requirement.condition_note ?? "Conditional"
                          : "Required"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={statusConfig.badgeClass}>
                          {statusConfig.label}
                        </span>
                        {!cantChange && (
                          <select
                            value={currentStatus}
                            className="form-select"
                            style={{ padding: ".25rem .5rem", fontSize: ".75rem", width: "auto", minWidth: 110 }}
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
                        )}
                        {cantChange && (
                          <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                            (locked)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {doc.file_path ? (
                        <button
                          type="button"
                          onClick={() => void onViewFile(doc.file_path as string)}
                          className="btn btn-ghost btn-sm"
                        >
                          View File
                        </button>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                          No file uploaded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* File view error */}
      {viewFileError && (
        <div className="alert alert-error text-sm" role="alert">
          {viewFileError}
        </div>
      )}
    </div>
  );
}
