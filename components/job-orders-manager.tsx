"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ClipboardList, Trash2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { JobOrderDeploymentManager } from "@/components/job-order-deployment-manager";
import type { BatchRow, DeploymentRow, JobOrderV2Row } from "@/lib/data/batches";

type JobOrderDetail = {
  jobOrder: JobOrderV2Row;
  batches: BatchRow[];
  deploymentsByBatch: Record<string, DeploymentRow[]>;
};

type Props = {
  jobOrderDetails: JobOrderDetail[];
  staffRole: "front_desk" | "processing_officer" | "admin";
};

export function JobOrdersManager({ jobOrderDetails, staffRole }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(jobOrderDetails[0]?.jobOrder.id || null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    job_order_number: "",
    positions: [
      {
        position: "",
        needed: 1,
        position_code: "",
        salary_amount: undefined as number | undefined,
        salary_currency: "PHP",
        salary_period: "Monthly",
        wage_type: "Gross",
      },
    ],
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
  const [createError, setCreateError] = useState<string | null>(null);

  // Reference Data
  const [trades, setTrades] = useState<string[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; country: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; name: string; is_final_employer: boolean }[]>([]);
  const [accreditations, setAccreditations] = useState<{ id: string; accreditation_id_dmw: string }[]>([]);
  const [tradeFilter, setTradeFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  useEffect(() => {
    fetch("/api/public/trades", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrades(data.map((d) => d.name));
      })
      .catch((err) => console.error("Failed to load trades:", err));

    fetch("/api/staff/programs", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPrograms(data);
      })
      .catch((err) => console.error("Failed to load programs:", err));

    fetch("/api/staff/partners", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPartners(data);
      })
      .catch((err) => console.error("Failed to load partners:", err));

    fetch("/api/staff/accreditations", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAccreditations(data);
      })
      .catch((err) => console.error("Failed to load accreditations:", err));
  }, []);

  const filteredOrders = useMemo(() => {
    return jobOrderDetails.filter((d) => {
      const jo = d.jobOrder;
      if (tradeFilter) {
        const matchesTrade =
          jo.trade?.toLowerCase() === tradeFilter.toLowerCase() ||
          jo.positions?.some((p) => p.position.toLowerCase() === tradeFilter.toLowerCase());
        if (!matchesTrade) return false;
      }
      if (programFilter) {
        if (jo.program_name?.toLowerCase() !== programFilter.toLowerCase()) return false;
      }
      if (search.trim()) {
        const lower = search.toLowerCase();
        const matchesSearch =
          jo.job_order_number?.toLowerCase().includes(lower) ||
          jo.trade?.toLowerCase().includes(lower) ||
          jo.country?.toLowerCase().includes(lower) ||
          jo.program_name?.toLowerCase().includes(lower) ||
          (jo.positions && jo.positions.some((p) => p.position.toLowerCase().includes(lower)));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [jobOrderDetails, search, tradeFilter, programFilter]);

  const selectedDetail = jobOrderDetails.find((d) => d.jobOrder.id === selectedId);

  const handleAddPosition = () => {
    setForm((prev) => ({
      ...prev,
      positions: [
        ...prev.positions,
        {
          position: "",
          needed: 1,
          position_code: "",
          salary_amount: undefined,
          salary_currency: "PHP",
          salary_period: "Monthly",
          wage_type: "Gross",
        },
      ],
    }));
  };

  const handleRemovePosition = (index: number) => {
    if (form.positions.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index),
    }));
  };

  const handlePositionChange = (index: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.positions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, positions: updated };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_order_number.trim()) {
      setCreateError("Job Order Number is required.");
      return;
    }
    if (!form.trade.trim()) {
      setCreateError("Trade / Skill category is required.");
      return;
    }
    if (!form.valid_until) {
      setCreateError("Validity date is required.");
      return;
    }
    if (form.positions.some((p) => !p.position.trim())) {
      setCreateError("All positions must have a designated title.");
      return;
    }

    setSaving(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/staff/job-orders-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      setShowCreateModal(false);
      setForm({
        job_order_number: "",
        positions: [
          {
            position: "",
            needed: 1,
            position_code: "",
            salary_amount: undefined,
            salary_currency: "PHP",
            salary_period: "Monthly",
            wage_type: "Gross",
          },
        ],
        class: "Initial",
        valid_until: "",
        country: "",
        program_name: "",
        trade: "",
        gender_requirement: "",
        accreditation_id: "",
        foreign_partner_id: "",
      });
      router.refresh();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create job order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
      {/* 1. Fixed Header (Shrink-0) */}
      <header className="shrink-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Job Orders</h1>
            <p className="text-[11px] text-gray-500 leading-tight">Manage allocations and deployments</p>
          </div>
        </div>
        {staffRole !== "front_desk" && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Job Order
          </Button>
        )}
      </header>

      {/* 2. Fixed Filter Bar (Shrink-0) */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-shadow" 
            placeholder="Search job orders..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Trades ({trades.length})</option>
          {trades.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="text-xs rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Programs ({programs.length})</option>
          {programs.map((p) => (
            <option key={p.id} value={p.name}>{p.name} ({p.country})</option>
          ))}
        </select>

        {(search || tradeFilter || programFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setTradeFilter("");
              setProgramFilter("");
            }}
            className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 3. Split Pane Work Area (Flex-1 Min-H-0 Overflow-Hidden) */}
      <main className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg flex overflow-hidden">
        
        {/* Left Pane: Master List */}
        <div className="w-80 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/30">
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredOrders.map(({ jobOrder, batches, deploymentsByBatch }) => {
              const isActive = selectedId === jobOrder.id;
              const deploymentCount = Object.values(deploymentsByBatch).reduce((sum, items) => sum + items.length, 0);
              
              return (
                <button
                  key={jobOrder.id}
                  onClick={() => setSelectedId(jobOrder.id)}
                  className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                    isActive 
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20" 
                      : "bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-bold text-[13px] text-gray-900 truncate">
                      {jobOrder.job_order_number ?? jobOrder.id.split("-")[0]}
                    </span>
                    <StatusBadge variant={jobOrder.status === "open" ? "success" : "neutral"}>
                      {jobOrder.status}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] font-medium text-gray-600 truncate">
                    {jobOrder.positions && jobOrder.positions.length > 0
                      ? jobOrder.positions.map(p => p.position).join(", ")
                      : jobOrder.trade ?? "Unknown"}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span>{jobOrder.country || "Japan"}</span>
                    <span>{deploymentCount} / {jobOrder.manpower_requested ?? 0} slots</span>
                  </div>
                </button>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="text-center p-8">
                <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No Job Orders</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
          <footer className="shrink-0 bg-gray-50 border-t border-gray-200 px-3 py-2 text-[10px] text-gray-500 font-medium">
            Showing {filteredOrders.length} job orders
          </footer>
        </div>

        {/* Right Pane: Detail View */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {selectedDetail ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <JobOrderDeploymentManager
                jobOrder={selectedDetail.jobOrder}
                initialBatches={selectedDetail.batches}
                initialDeploymentsByBatch={selectedDetail.deploymentsByBatch}
                staffRole={staffRole}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <ClipboardList className="w-12 h-12 text-gray-200 mb-3" />
              <h3 className="text-base font-bold text-gray-900">Select a Job Order</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Choose a job order from the list on the left to manage its batches and deploy applicants.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── CREATE JOB ORDER MODAL (Full DMW Positions + Trades Dropdown) ── */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create Job Order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Job Order Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. JO-2026-001"
                value={form.job_order_number}
                onChange={(e) => setForm({ ...form, job_order_number: e.target.value })}
                required
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Trade / Skill Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.trade}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => {
                    const updatedPositions = [...prev.positions];
                    if (updatedPositions.length === 1 && !updatedPositions[0].position) {
                      updatedPositions[0].position = val;
                    }
                    return { ...prev, trade: val, positions: updatedPositions };
                  });
                }}
                required
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select a trade / skill...</option>
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Company (Foreign Partner)</label>
              <select
                value={form.foreign_partner_id}
                onChange={(e) => setForm({ ...form, foreign_partner_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select an employer partner...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">DMW Accreditation</label>
              <select
                value={form.accreditation_id}
                onChange={(e) => setForm({ ...form, accreditation_id: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select an accreditation...</option>
                {accreditations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accreditation_id_dmw}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Program</label>
              <select
                value={form.program_name}
                onChange={(e) => {
                  const prog = programs.find((p) => p.name === e.target.value);
                  setForm({
                    ...form,
                    program_name: e.target.value,
                    country: prog ? prog.country : form.country,
                  });
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Country</label>
              <input
                type="text"
                placeholder="e.g. Japan"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                required
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* DMW Job Order Positions Section */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-gray-900 block">Positions & Allocations</span>
                <span className="text-[10px] text-gray-500">Each position requested under this DMW Job Order</span>
              </div>
              <button
                type="button"
                onClick={handleAddPosition}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Position
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {form.positions.map((pos, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/70 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-700 text-[11px]">Position #{idx + 1}</span>
                    {form.positions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePosition(idx)}
                        className="text-gray-400 hover:text-red-600 p-0.5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">Position Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Welder or Machine Operator"
                        value={pos.position}
                        onChange={(e) => handlePositionChange(idx, "position", e.target.value)}
                        required
                        className="w-full px-2.5 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">Slots Needed</label>
                      <input
                        type="number"
                        min="1"
                        value={pos.needed}
                        onChange={(e) => handlePositionChange(idx, "needed", parseInt(e.target.value) || 1)}
                        required
                        className="w-full px-2.5 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">DMW Ref Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 678948"
                        value={pos.position_code}
                        onChange={(e) => handlePositionChange(idx, "position_code", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">Monthly Salary</label>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={pos.salary_amount ?? ""}
                        onChange={(e) => handlePositionChange(idx, "salary_amount", e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">Currency</label>
                      <select
                        value={pos.salary_currency}
                        onChange={(e) => handlePositionChange(idx, "salary_currency", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                      >
                        <option value="JPY">JPY (¥)</option>
                        <option value="USD">USD ($)</option>
                        <option value="PHP">PHP (₱)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-600 font-medium block mb-0.5">Wage Type</label>
                      <select
                        value={pos.wage_type}
                        onChange={(e) => handlePositionChange(idx, "wage_type", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-[11px] bg-white"
                      >
                        <option value="Gross">Gross</option>
                        <option value="Net">Net</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={saving}
              disabled={saving}
            >
              {saving ? "Saving..." : "Create Job Order"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
