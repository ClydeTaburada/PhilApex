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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    job_order_number: "",
    positions: [{ position: "", needed: 1, position_code: "", salary_amount: undefined as number | undefined, salary_currency: "PHP", salary_period: "Monthly", wage_type: "Gross" }],
    class: "Initial",
    valid_until: "",
    country: "",
    program_name: "",
    trade: "",
    gender_requirement: "" as "" | "male" | "female",
    accreditation_id: "",
    foreign_partner_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; country: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string; is_final_employer: boolean }[]>([]);
  const [accreditations, setAccreditations] = useState<{ id: string; accreditation_id_dmw: string }[]>([]);

  useEffect(() => {
    fetch("/api/public/trades", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrades(data.map((d) => d.name));
      })
      .catch((err) => console.error(err));

    fetch("/api/staff/programs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPrograms(data);
      })
      .catch((err) => console.error(err));

    fetch("/api/staff/partners", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPartners(data);
      })
      .catch((err) => console.error(err));

    fetch("/api/staff/accreditations", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAccreditations(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const totalPages = Math.max(1, Math.ceil(jobOrderDetails.length / PAGE_SIZE));

  const handleEdit = (jo: JobOrderDetail["jobOrder"]) => {
    setForm({
      job_order_number: jo.job_order_number || "",
      positions: jo.positions && jo.positions.length > 0 ? jo.positions.map(p => ({
        position: p.position,
        position_code: p.position_code || "",
        needed: p.needed,
        salary_amount: p.salary_amount || undefined,
        salary_currency: p.salary_currency || "PHP",
        salary_period: p.salary_period || "Monthly",
        wage_type: p.wage_type || "Gross",
      })) : [{ position: jo.trade || "", needed: jo.manpower_requested || 1, position_code: "", salary_amount: undefined as number | undefined, salary_currency: "PHP", salary_period: "Monthly", wage_type: "Gross" }],
      class: jo.class as any || "Initial",
      valid_until: jo.valid_until || "",
      country: jo.country || "",
      program_name: jo.program_name || "",
      trade: jo.trade || "",
      gender_requirement: jo.gender_requirement as any || "",
      accreditation_id: jo.accreditation_id || "",
      foreign_partner_id: jo.foreign_partner_id || "",
    });
    setEditingId(jo.id);
    setShowCreateModal(true);
  };

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
                      <div className="flex flex-col gap-1">
                        {(jobOrder.positions && jobOrder.positions.length > 0) ? (
                          jobOrder.positions.map((p, idx) => (
                            <span key={idx} className="font-medium text-ink text-sm flex gap-2 items-center">
                              {p.position} <span className="text-xs text-ink-muted bg-slate-100 px-1.5 py-0.5 rounded">x{p.needed}</span>
                            </span>
                          ))
                        ) : (
                          <span className="font-medium text-ink">{jobOrder.trade ?? "Unknown"}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs uppercase tracking-wide text-ink-muted">{jobOrder.class ?? "direct"}</span>
                    </td>
                    <td>
                      <span className="font-medium">{deploymentCount} / {jobOrder.manpower_requested ?? 0}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs">{jobOrder.valid_until ?? "—"}</span>
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedJobOrder({ jobOrder, batches, deploymentsByBatch })}
                        >
                          Manage ({batches.length})
                        </button>
                        {staffRole === "admin" && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-brand-primary"
                            onClick={() => handleEdit(jobOrder)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
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
                <h3 className="font-semibold text-lg">{editingId ? "Edit Job Order" : "Create Job Order"}</h3>
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
                  <select value={form.class} onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value as any }))} className="form-select">
                    <option value="Initial">Initial</option>
                    <option value="Additional">Additional</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Validity Date</label>
                  <input type="date" value={form.valid_until} onChange={(e) => setForm((prev) => ({ ...prev, valid_until: e.target.value }))} className="form-input" />
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                   <h4 className="font-bold text-sm">Positions Needed</h4>
                   <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => setForm(prev => ({...prev, positions: [...prev.positions, { position: "", needed: 1, position_code: "", salary_amount: undefined as number | undefined, salary_currency: "PHP", salary_period: "Monthly", wage_type: "Gross" }]}))}>+ Add Position</button>
                </div>
                {form.positions.map((pos, idx) => (
                  <div key={idx} className="grid gap-3 md:grid-cols-3 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm relative">
                    {form.positions.length > 1 && (
                       <button type="button" onClick={() => setForm(prev => ({...prev, positions: prev.positions.filter((_, i) => i !== idx)}))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex justify-center items-center text-xs hover:bg-red-200">×</button>
                    )}
                    <div className="form-field md:col-span-2">
                      <label className="form-label text-xs">Position Title</label>
                      <input value={pos.position} onChange={(e) => setForm((prev) => { const np = [...prev.positions]; np[idx].position = e.target.value; return {...prev, positions: np}; })} className="form-input text-sm py-1.5" placeholder="e.g. Welder" />
                    </div>
                    <div className="form-field">
                      <label className="form-label text-xs">Slots</label>
                      <input type="number" min={1} value={pos.needed} onChange={(e) => setForm((prev) => { const np = [...prev.positions]; np[idx].needed = Number(e.target.value); return {...prev, positions: np}; })} className="form-input text-sm py-1.5" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="form-field">
                  <label className="form-label">Accreditation</label>
                  <select value={form.accreditation_id} onChange={(e) => setForm((prev) => ({ ...prev, accreditation_id: e.target.value }))} className="form-select">
                    <option value="">Select an accreditation...</option>
                    {accreditations.map((a) => (
                      <option key={a.id} value={a.id}>{a.accreditation_id_dmw}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Company (Final Employer)</label>
                  <select value={form.foreign_partner_id} onChange={(e) => setForm((prev) => ({ ...prev, foreign_partner_id: e.target.value }))} className="form-select">
                    <option value="">Select a company...</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
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
                  <select value={form.trade} onChange={(e) => setForm((prev) => {
                    const newPositions = [...prev.positions];
                    if (newPositions.length === 1 && !newPositions[0].position) {
                       newPositions[0].position = e.target.value;
                    }
                    return ({ ...prev, trade: e.target.value, positions: newPositions })
                  })} className="form-select">
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
              <button type="button" className="btn btn-ghost" onClick={() => {
                setShowCreateModal(false);
                setEditingId(null);
                setForm({
                  job_order_number: "",
                  positions: [{ position: "", needed: 1, position_code: "", salary_amount: undefined as number | undefined, salary_currency: "PHP", salary_period: "Monthly", wage_type: "Gross" }],
                  class: "Initial",
                  valid_until: "",
                  country: "",
                  program_name: "",
                  trade: "",
                  gender_requirement: "",
                  accreditation_id: "",
                  foreign_partner_id: "",
                });
              }}>
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
                  if (!form.valid_until) {
                    setCreateError("Validity date is required.");
                    return;
                  }
                  if (form.positions.some(p => !p.position.trim())) {
                    setCreateError("All positions must have a title.");
                    return;
                  }
                  setSaving(true);
                  setFeedback(null);
                  setCreateError(null);
                  try {
                    const res = await fetch("/api/staff/job-orders-v2", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: editingId || undefined,
                        job_order_number: form.job_order_number,
                        positions: form.positions,
                        class: form.class,
                        valid_until: form.valid_until,
                        country: form.country,
                        program_name: form.program_name,
                        trade: form.trade,
                        gender_requirement: form.gender_requirement || null,
                        accreditation_id: form.accreditation_id || null,
                        foreign_partner_id: form.foreign_partner_id || null,
                      }),
                    });
                    const body = await res.json();
                    if (!res.ok) throw new Error(body.error || "Unable to create job order");
                    setFeedback(editingId ? "Job order updated successfully." : "Job order created successfully.");
                    setForm({
                      job_order_number: "",
                      positions: [{ position: "", needed: 1, position_code: "", salary_amount: undefined as number | undefined, salary_currency: "PHP", salary_period: "Monthly", wage_type: "Gross" }],
                      class: "Initial",
                      valid_until: "",
                      country: "",
                      program_name: "",
                      trade: "",
                      gender_requirement: "",
                      accreditation_id: "",
                      foreign_partner_id: "",
                    });
                    setTimeout(() => {
                      setShowCreateModal(false);
                      setEditingId(null);
                    }, 700);
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : "Unable to create job order";
                    setCreateError(message);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? (editingId ? "Saving…" : "Creating…") : (editingId ? "Save Changes" : "Create Job Order")}
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
                  {selectedJobOrder.jobOrder.positions && selectedJobOrder.jobOrder.positions.length > 0 
                    ? selectedJobOrder.jobOrder.positions.map(p => p.position).join(", ") 
                    : (selectedJobOrder.jobOrder.trade ?? "Unknown")}
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
