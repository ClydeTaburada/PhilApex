"use client";

import { useEffect, useMemo, useState } from "react";
import type { BatchRow, DeploymentRow, JobOrderV2Row } from "@/lib/data/batches";
import { JobOrderDeploymentManager } from "@/components/job-order-deployment-manager";
import { ExpiryBadge } from "@/components/expiry-badge";

type JobOrderDetail = {
  jobOrder: JobOrderV2Row;
  batches: BatchRow[];
  deploymentsByBatch: Record<string, DeploymentRow[]>;
};

type Props = {
  jobOrderDetails: JobOrderDetail[];
  staffRole: "front_desk" | "processing_officer" | "admin";
};

const PAGE_SIZE = 10;

export function JobOrderOverviewTable({ jobOrderDetails, staffRole }: Props) {
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrderDetail | null>(null);
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    job_order_number: "",
    position: "",
    class: "direct" as "direct" | "additional",
    manpower_requested: 1,
    jo_validity_date: "",
    country: "",
    program_name: "",
    trade: "",
    gender_requirement: "" as "" | "male" | "female",
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; country: string }[]>([]);

  useEffect(() => {
    fetch("/api/public/trades")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrades(data.map((d) => d.name));
      })
      .catch((err) => console.error(err));

    fetch("/api/staff/programs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPrograms(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const totalPages = Math.max(1, Math.ceil(jobOrderDetails.length / PAGE_SIZE));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return jobOrderDetails.slice(start, start + PAGE_SIZE);
  }, [jobOrderDetails, page]);

  return (
    <>
      <div className="card rounded-xl overflow-hidden">
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Job Orders</h2>
            <p className="text-sm text-ink-muted">Open a job order to create batches and assign applicants.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            + New Job Order
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>JO Number</th>
                <th>Position</th>
                <th>Class</th>
                <th>Slots (Filled/Req)</th>
                <th>Validity</th>
                <th>Accreditation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(({ jobOrder, batches, deploymentsByBatch }) => {
                const deploymentCount = Object.values(deploymentsByBatch).reduce(
                  (sum, items) => sum + items.length,
                  0,
                );

                return (
                  <tr key={jobOrder.id}>
                    <td>
                      <span className="font-bold text-sm">
                        {jobOrder.job_order_number ?? jobOrder.id.split("-")[0]}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-ink">{jobOrder.position ?? jobOrder.trade ?? "Unknown"}</span>
                    </td>
                    <td>
                      <span className="text-xs uppercase tracking-wide text-ink-muted">{jobOrder.class ?? "direct"}</span>
                    </td>
                    <td>
                      <span className="font-medium">{deploymentCount} / {jobOrder.manpower_requested ?? jobOrder.slots_total}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs">{jobOrder.jo_validity_date ?? "—"}</span>
                        {jobOrder.jo_validity_tier && <ExpiryBadge tier={jobOrder.jo_validity_tier} />}
                      </div>
                    </td>
                    <td>
                      {jobOrder.accreditation_expiry_tier ? (
                        <ExpiryBadge tier={jobOrder.accreditation_expiry_tier} />
                      ) : (
                        <span className="text-ink-faint text-xs">Legacy</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedJobOrder({ jobOrder, batches, deploymentsByBatch })}
                      >
                        Manage ({batches.length} {batches.length === 1 ? "batch" : "batches"})
                      </button>
                    </td>
                  </tr>
                );
              })}
              {jobOrderDetails.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-ink-muted">
                    No job orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {jobOrderDetails.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink-muted">
              Showing {Math.min(jobOrderDetails.length, (page - 1) * PAGE_SIZE + 1)}-{Math.min(page * PAGE_SIZE, jobOrderDetails.length)} of {jobOrderDetails.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-ink-muted">Page {page} of {totalPages}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Create Job Order</h3>
                <p className="text-sm text-ink-muted">Add a new job order so staff can create batches and assign applicants.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
                Close
              </button>
            </div>

            {feedback && <div className="alert alert-success text-sm mb-3">{feedback}</div>}
            {createError && <div className="alert alert-error text-sm mb-3" role="alert">{createError}</div>}

            <div className="grid gap-3">
              <div className="form-field">
                <label className="form-label">JO Number</label>
                <input value={form.job_order_number} onChange={(e) => setForm((prev) => ({ ...prev, job_order_number: e.target.value }))} className="form-input" placeholder="JO-1002" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">Class</label>
                  <select value={form.class} onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value as "direct" | "additional" }))} className="form-select">
                    <option value="direct">Direct</option>
                    <option value="additional">Additional</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Slots Required</label>
                  <input type="number" min={1} value={form.manpower_requested} onChange={(e) => setForm((prev) => ({ ...prev, manpower_requested: Number(e.target.value) }))} className="form-input" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Validity Date</label>
                <input type="date" value={form.jo_validity_date} onChange={(e) => setForm((prev) => ({ ...prev, jo_validity_date: e.target.value }))} className="form-input" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">Country</label>
                  <input 
                    value={form.country} 
                    readOnly 
                    className="form-input bg-gray-50 text-ink-muted cursor-not-allowed" 
                    placeholder="Auto-filled..." 
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Program</label>
                  <select
                    value={form.program_name}
                    onChange={(e) => {
                      const prog = programs.find((p) => p.name === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        program_name: e.target.value,
                        country: prog ? prog.country : "",
                      }));
                    }}
                    className="form-select"
                  >
                    <option value="">Select a program...</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">Trade / Position</label>
                  <select value={form.trade} onChange={(e) => setForm((prev) => ({ ...prev, trade: e.target.value, position: e.target.value }))} className="form-select">
                    <option value="">Select a trade...</option>
                    {trades.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Gender Requirement</label>
                  <select value={form.gender_requirement} onChange={(e) => setForm((prev) => ({ ...prev, gender_requirement: e.target.value as any }))} className="form-select">
                    <option value="">Any Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={async () => {
                  // Client-side required-field validation
                  if (!form.job_order_number.trim()) {
                    setCreateError("JO Number is required.");
                    return;
                  }
                  if (!form.trade.trim()) {
                    setCreateError("Trade / Position is required.");
                    return;
                  }
                  if (!form.jo_validity_date) {
                    setCreateError("Validity date is required.");
                    return;
                  }
                  setSaving(true);
                  setFeedback(null);
                  setCreateError(null);
                  try {
                    const res = await fetch("/api/staff/job-orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        job_order_number: form.job_order_number,
                        position: form.position,
                        class: form.class,
                        manpower_requested: form.manpower_requested,
                        jo_validity_date: form.jo_validity_date,
                        country: form.country,
                        program_name: form.program_name,
                        trade: form.trade,
                        gender_requirement: form.gender_requirement || null,
                        slots_total: form.manpower_requested,
                        slots_filled: 0,
                      }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.error || "Unable to create job order");
                    setFeedback("Job order created successfully.");
                    setForm({
                      job_order_number: "",
                      position: "",
                      class: "direct",
                      manpower_requested: 1,
                      jo_validity_date: "",
                      country: "",
                      program_name: "",
                      trade: "",
                      gender_requirement: "",
                    });
                    setTimeout(() => setShowCreateModal(false), 700);
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Unable to create job order";
                    setCreateError(message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Creating…" : "Create Job Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedJobOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedJobOrder.jobOrder.job_order_number ?? selectedJobOrder.jobOrder.id.split("-")[0]}
                </h3>
                <p className="text-sm text-ink-muted">
                  {selectedJobOrder.jobOrder.position ?? selectedJobOrder.jobOrder.trade ?? "Unknown"}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedJobOrder(null)}>
                Close
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-4">
              <JobOrderDeploymentManager
                jobOrder={selectedJobOrder.jobOrder}
                initialBatches={selectedJobOrder.batches}
                initialDeploymentsByBatch={selectedJobOrder.deploymentsByBatch}
                staffRole={staffRole}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
