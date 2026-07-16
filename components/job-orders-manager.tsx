"use client";

import { useMemo, useState, useEffect } from "react";

type JobOrder = {
  id: string;
  country: string;
  program_name: string;
  trade: string;
  gender_requirement: "male" | "female" | null;
  slots_total: number;
  slots_filled: number;
  status: "open" | "closed";
};

type Props = {
  initialRows: JobOrder[];
  canManage: boolean;
};

type FormState = {
  id?: string;
  country: string;
  program_name: string;
  trade: string;
  gender_requirement: "male" | "female" | "";
  slots_total: number;
  slots_filled: number;
};

const EMPTY_FORM: FormState = {
  country: "",
  program_name: "",
  trade: "",
  gender_requirement: "",
  slots_total: 1,
  slots_filled: 0,
};

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const full = pct >= 100;
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: full ? "var(--crimson)" : "var(--navy)",
          }}
        />
      </div>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: full ? "var(--crimson)" : "var(--ink-muted)", minWidth: 36 }}
      >
        {filled}/{total}
      </span>
    </div>
  );
}

export function JobOrdersManager({ initialRows, canManage }: Props) {
  const [rows, setRows] = useState<JobOrder[]>(initialRows);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/public/trades")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrades(data.map((d) => d.name));
      })
      .catch((err) => console.error(err));
  }, []);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.status === b.status ? 0 : a.status === "open" ? -1 : 1)),
    [rows],
  );

  const isEditing = Boolean(form.id);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => setForm(EMPTY_FORM);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) {
      setError("Only processing officers and admins can manage job orders.");
      return;
    }
    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        id: form.id,
        country: form.country,
        program_name: form.program_name,
        trade: form.trade,
        gender_requirement: form.gender_requirement || undefined,
        slots_total: Number(form.slots_total),
        slots_filled: Number(form.slots_filled),
      };

      const response = await fetch("/api/staff/job-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string; data?: JobOrder };
      if (!response.ok || !body.data) {
        setError(body.error ?? "Unable to save job order");
        return;
      }

      const savedRow = body.data;
      setRows((prev) => {
        const exists = prev.find((r) => r.id === savedRow.id);
        return exists
          ? prev.map((r) => (r.id === savedRow.id ? savedRow : r))
          : [savedRow, ...prev];
      });
      resetForm();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Form ─────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
            {isEditing ? "Edit Job Order" : "New Job Order"}
          </p>
          {isEditing && (
            <button type="button" onClick={resetForm} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="form-field">
            <label className="form-label" htmlFor="jo-country">Country</label>
            <input
              id="jo-country"
              value={form.country}
              onChange={(e) => setField("country", e.target.value)}
              className="form-input"
              placeholder="Japan, Taiwan…"
              required
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="jo-program">Program</label>
            <input
              id="jo-program"
              value={form.program_name}
              onChange={(e) => setField("program_name", e.target.value)}
              className="form-input"
              placeholder="e.g. TITP, SSW"
              required
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="jo-trade">Trade</label>
            <select
              id="jo-trade"
              value={form.trade}
              onChange={(e) => setField("trade", e.target.value)}
              className="form-select"
              required
              disabled={!canManage || isSaving}
            >
              <option value="">Select trade...</option>
              {trades.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="jo-gender">Gender Requirement</label>
            <select
              id="jo-gender"
              value={form.gender_requirement}
              onChange={(e) =>
                setField("gender_requirement", e.target.value as FormState["gender_requirement"])
              }
              className="form-select"
              disabled={!canManage || isSaving}
            >
              <option value="">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="jo-slots-total">Total Slots</label>
            <input
              id="jo-slots-total"
              type="number"
              min={1}
              value={form.slots_total}
              onChange={(e) => setField("slots_total", Number(e.target.value))}
              className="form-input"
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="jo-slots-filled">Slots Filled</label>
            <input
              id="jo-slots-filled"
              type="number"
              min={0}
              value={form.slots_filled}
              onChange={(e) => setField("slots_filled", Number(e.target.value))}
              className="form-input"
              disabled={!canManage || isSaving}
            />
          </div>
        </div>

        {error ? (
          <div className="alert alert-error text-sm mt-3" role="alert">
            {error}
          </div>
        ) : null}

        {!canManage && (
          <div className="alert alert-info text-sm mt-3">
            Only processing officers and admins can create or edit job orders.
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            id="jo-submit"
            type="submit"
            disabled={isSaving || !canManage}
            className="btn btn-primary"
          >
            {isSaving ? "Saving…" : isEditing ? "Update Job Order" : "Create Job Order"}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="btn btn-ghost">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── Table ────────────────────────────────────── */}
      <div className="card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
            All Job Orders
            <span
              className="ml-2 font-normal text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              {sortedRows.filter((r) => r.status === "open").length} open /{" "}
              {sortedRows.length} total
            </span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Program</th>
                <th>Trade</th>
                <th>Gender</th>
                <th style={{ minWidth: 160 }}>Slots</th>
                <th>Status</th>
                {canManage && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold" style={{ color: "var(--ink)" }}>
                    {row.country}
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>{row.program_name}</td>
                  <td style={{ color: "var(--ink)" }}>{row.trade}</td>
                  <td>
                    {row.gender_requirement ? (
                      <span
                        className="badge"
                        style={{
                          background: row.gender_requirement === "male" ? "#DBEAFE" : "#FCE7F3",
                          color: row.gender_requirement === "male" ? "#1E40AF" : "#9D174D",
                        }}
                      >
                        {row.gender_requirement}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--ink-faint)" }}>Any</span>
                    )}
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <SlotBar filled={row.slots_filled} total={row.slots_total} />
                  </td>
                  <td>
                    <span
                      className={`badge ${row.status === "open" ? "badge-green" : "badge-gray"}`}
                    >
                      {row.status === "open" ? "Open" : "Closed"}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          setForm({
                            id: row.id,
                            country: row.country,
                            program_name: row.program_name,
                            trade: row.trade,
                            gender_requirement: row.gender_requirement ?? "",
                            slots_total: row.slots_total,
                            slots_filled: row.slots_filled,
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="text-center py-12"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    <div className="text-3xl mb-2">📋</div>
                    No job orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
