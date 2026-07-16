"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BatchRow, DeploymentRow } from "@/lib/data/batches";
import type { JobOrderV2Row } from "@/lib/data/batches";
import { DeploymentTable } from "@/components/deployment-table";
import { AccreditationOverrideModal } from "@/components/accreditation-override-modal";

type ApplicantOption = { id: string; full_name: string; occupation_applied: string | null };

type Props = {
  jobOrder: JobOrderV2Row;
  initialBatches: BatchRow[];
  initialDeploymentsByBatch: Record<string, DeploymentRow[]>;
  staffRole: "front_desk" | "processing_officer" | "admin";
};

export function JobOrderDeploymentManager({
  jobOrder,
  initialBatches,
  initialDeploymentsByBatch,
  staffRole,
}: Props) {
  const [batches, setBatches] = useState(initialBatches);
  const [deploymentsByBatch, setDeploymentsByBatch] = useState(initialDeploymentsByBatch);
  const [batchLabel, setBatchLabel] = useState("");
  const [search, setSearch] = useState("");
  const [applicantOptions, setApplicantOptions] = useState<ApplicantOption[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [overridePrompt, setOverridePrompt] = useState<{ batchId: string; message: string } | null>(null);
  const [openBatchId, setOpenBatchId] = useState<string | null>(
    initialBatches.length > 0 ? (initialBatches[0]?.id ?? null) : null
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const canManage = staffRole === "admin" || staffRole === "processing_officer";

  useEffect(() => {
    if (!search.trim()) { setApplicantOptions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/staff/applicants?q=${encodeURIComponent(search)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setApplicantOptions(data); })
        .catch(() => undefined);
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [search]);

  const createBatch = async () => {
    if (!canManage || !batchLabel.trim()) return;
    setBatchLoading(true);
    setBatchError(null);
    try {
      const res = await fetch(`/api/staff/job-orders-v2/${jobOrder.id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_label: batchLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Unable to create batch");
      const newBatch: BatchRow = {
        id: String(data.id),
        job_order_id: String(data.job_order_id),
        batch_label: String(data.batch_label),
        created_at: String(data.created_at),
      };
      setBatches((prev) => [...prev, newBatch]);
      setDeploymentsByBatch((prev) => ({ ...prev, [newBatch.id]: [] }));
      setOpenBatchId(newBatch.id);
      setBatchLabel("");
    } catch (err: unknown) {
      setBatchError(err instanceof Error ? err.message : "Unable to create batch");
    } finally {
      setBatchLoading(false);
    }
  };

  const selectApplicant = (applicant: ApplicantOption) => {
    setSelectedApplicant(applicant);
    setSearch("");
    setApplicantOptions([]);
  };

  const clearSelectedApplicant = () => {
    setSelectedApplicant(null);
    setSearch("");
    setApplicantOptions([]);
    searchRef.current?.focus();
  };

  const addDeployment = async (batchId: string, overrideConfirmed = false) => {
    if (!canManage || !selectedApplicant) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/batches/${batchId}/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_id: selectedApplicant.id,
          hired_date: new Date().toISOString().slice(0, 10),
          document_status: "on_process",
          override_confirmed: overrideConfirmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.warning) {
          setOverridePrompt({ batchId, message: data.message || "This deployment has an expiration warning." });
          return;
        }
        throw new Error(typeof data.error === "string" ? data.error : "Unable to add deployment");
      }
      setDeploymentsByBatch((prev) => ({
        ...prev,
        [batchId]: [...(prev[batchId] ?? []), data as DeploymentRow],
      }));
      setOpenBatchId(batchId);
      clearSelectedApplicant();
      setOverridePrompt(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to add deployment");
    } finally {
      setLoading(false);
    }
  };

  const updateDeployment = async (id: string, updates: Partial<DeploymentRow>) => {
    setError(null);
    try {
      const res = await fetch(`/api/staff/deployments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Unable to update deployment");
      setDeploymentsByBatch((prev) => {
        const batchId = Object.keys(prev).find((bid) => prev[bid]?.some((d) => d.id === id));
        if (!batchId) return prev;
        return { ...prev, [batchId]: (prev[batchId] ?? []).map((d) => (d.id === id ? (data as DeploymentRow) : d)) };
      });
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to update deployment");
      return false;
    }
  };

  const removeDeployment = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/staff/deployments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Unable to remove deployment");
      setDeploymentsByBatch((prev) => {
        const next: Record<string, DeploymentRow[]> = {};
        for (const [bid, items] of Object.entries(prev)) next[bid] = items.filter((i) => i.id !== id);
        return next;
      });
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to remove deployment");
      return false;
    }
  };

  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => a.batch_label.localeCompare(b.batch_label)),
    [batches],
  );

  const totalDeployments = Object.values(deploymentsByBatch).reduce((s, d) => s + d.length, 0);

  return (
    <div className="space-y-4">
      <AccreditationOverrideModal
        isOpen={Boolean(overridePrompt)}
        message={overridePrompt?.message ?? "Proceed despite an expiration warning?"}
        onConfirm={() => void addDeployment(overridePrompt!.batchId, true)}
        onCancel={() => { setOverridePrompt(null); setError("Deployment was not created."); }}
      />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
          style={{ background: "var(--navy-faint)", color: "var(--navy)" }}>
          {sortedBatches.length} {sortedBatches.length === 1 ? "batch" : "batches"}
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
          style={{ background: "var(--green-lt)", color: "var(--green)" }}>
          {totalDeployments} assigned
        </span>
        {jobOrder.manpower_requested != null && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full font-medium"
            style={{ background: "var(--amber-lt)", color: "var(--amber)" }}>
            {Math.max(0, (jobOrder.manpower_requested ?? 0) - totalDeployments)} remaining
          </span>
        )}
      </div>

      {/* Global error */}
      {error && (
        <div className="alert alert-error text-sm flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100 ml-4">x</button>
        </div>
      )}

      {/* Step 1 + Step 2 side by side */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Step 1: Create a batch */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: "var(--navy)", color: "#fff" }}>1</span>
            <h3 className="font-bold text-sm">Create a Batch</h3>
          </div>
          <p className="text-xs text-ink-muted mb-3 pl-8">
            Groups applicants hired together. Example labels: <strong>Batch-1</strong>, <strong>Week 1</strong>.
          </p>
          {batchError && (
            <div className="alert alert-error text-sm mb-3" role="alert">{batchError}</div>
          )}
          <div className="flex gap-2">
            <input
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void createBatch(); }}
              className="form-input flex-1"
              placeholder="e.g. Batch-1"
              disabled={!canManage}
            />
            <button
              type="button"
              className="btn btn-primary whitespace-nowrap"
              onClick={() => void createBatch()}
              disabled={batchLoading || !canManage || !batchLabel.trim()}
            >
              {batchLoading ? "Creating..." : "+ Batch"}
            </button>
          </div>
          {!canManage && (
            <p className="text-xs text-ink-faint mt-2">Only admins and processing officers can create batches.</p>
          )}
        </div>

        {/* Step 2: Assign applicant */}
        <div className="card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: "var(--navy)", color: "#fff" }}>2</span>
            <h3 className="font-bold text-sm">Assign an Applicant</h3>
          </div>
          <p className="text-xs text-ink-muted mb-3 pl-8">
            Search, select an applicant, then click a batch below to add them.
          </p>

          {selectedApplicant ? (
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg mb-3"
              style={{ background: "var(--navy-faint)", border: "1px solid rgba(15,27,76,.15)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--navy)", color: "#fff" }}>
                {selectedApplicant.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selectedApplicant.full_name}</p>
                <p className="text-xs text-ink-muted truncate">{selectedApplicant.occupation_applied ?? "No trade listed"}</p>
              </div>
              <button type="button" onClick={clearSelectedApplicant}
                className="text-ink-faint hover:text-ink text-base p-1 rounded"
                title="Clear selection">x</button>
            </div>
          ) : (
            <div className="relative mb-3">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full"
                placeholder="Search applicant by name..."
                disabled={!canManage}
              />
              {applicantOptions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg shadow-xl border overflow-hidden"
                  style={{ background: "#fff", borderColor: "var(--border)" }}>
                  {applicantOptions.map((applicant) => (
                    <button
                      key={applicant.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                      onClick={() => selectApplicant(applicant)}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "var(--navy-faint)", color: "var(--navy)" }}>
                        {applicant.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{applicant.full_name}</div>
                        <div className="text-xs text-ink-faint">{applicant.occupation_applied ?? "No trade listed"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {sortedBatches.length === 0 ? (
            <p className="text-xs text-ink-faint">Create a batch in Step 1 first.</p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-ink-muted mb-2">Add to batch:</p>
              <div className="flex flex-wrap gap-2">
                {sortedBatches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void addDeployment(batch.id)}
                    disabled={!selectedApplicant || loading || !canManage}
                    title={!selectedApplicant ? "Select an applicant first" : `Add to ${batch.batch_label}`}
                  >
                    {loading ? "Adding..." : batch.batch_label}
                  </button>
                ))}
              </div>
              {!selectedApplicant && canManage && (
                <p className="text-xs text-ink-faint mt-2">Search and select an applicant above first.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Review deployments */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}>
          <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
            style={{ background: "var(--navy)", color: "#fff" }}>3</span>
          <div>
            <h3 className="font-bold text-sm">Review Deployments</h3>
            <p className="text-xs text-ink-muted">Click a batch to expand its list.</p>
          </div>
        </div>

        {sortedBatches.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-ink-muted">No batches yet</p>
            <p className="text-sm text-ink-faint mt-1">Create a batch above to get started.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {sortedBatches.map((batch) => {
              const batchDeployments = deploymentsByBatch[batch.id] ?? [];
              const isOpen = openBatchId === batch.id;
              return (
                <div key={batch.id}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenBatchId(isOpen ? null : batch.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted w-3">{isOpen ? "v" : ">"}</span>
                      <span className="font-semibold text-sm">Batch {batch.batch_label}</span>
                      <span className="text-xs text-ink-faint">
                        {batchDeployments.length === 0
                          ? "Empty"
                          : `${batchDeployments.length} applicant${batchDeployments.length !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={batchDeployments.length > 0
                        ? { background: "var(--navy)", color: "#fff" }
                        : { background: "#f3f4f6", color: "#6b7280" }}
                    >
                      {batchDeployments.length}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t" style={{ borderColor: "var(--border)" }}>
                      {batchDeployments.length === 0 ? (
                        <div className="px-5 py-6 text-center">
                          <p className="text-sm text-ink-faint">No applicants in this batch yet.</p>
                        </div>
                      ) : (
                        <DeploymentTable
                          deployments={batchDeployments}
                          staffRole={staffRole}
                          onUpdate={updateDeployment}
                          onRemove={removeDeployment}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
