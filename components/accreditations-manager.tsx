"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccreditationRow } from "@/lib/data/accreditations";
import type { PartnerRow } from "@/lib/data/partners";
import { ExpiryBadge } from "@/components/expiry-badge";

const emptyForm = {
  accreditation_id_dmw: "",
  principal_partner_id: "",
  processing_unit: "",
  representative: "",
  date_issued: new Date().toISOString().slice(0, 10),
  date_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "active" as "active" | "renewed" | "expired_unconfirmed",
};

export function AccreditationsManager({
  initialRows,
  partners,
}: {
  initialRows: AccreditationRow[];
  partners: PartnerRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewDates, setRenewDates] = useState({ date_issued: "", date_expiration: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.date_expiration.localeCompare(b.date_expiration)), [rows]);

  // Build a lookup map from partner id → name for reliable display
  const partnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    partners.forEach((p) => { map[p.id] = p.name; });
    return map;
  }, [partners]);

  const save = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/accreditations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || body.error || "Unable to save accreditation");
      setRows((prev) => [body, ...prev.filter((row) => row.id !== body.id)]);
      router.refresh();
      return body;
    } catch (err: any) {
      setError(err.message || "Unable to save accreditation");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      accreditation_id_dmw: form.accreditation_id_dmw,
      principal_partner_id: form.principal_partner_id,
      processing_unit: form.processing_unit || null,
      representative: form.representative || null,
      date_issued: form.date_issued,
      date_expiration: form.date_expiration,
      status: form.status,
    };
    const saved = await save(payload);
    if (saved) {
      setForm(emptyForm);
    }
  };

  const handleEdit = async (accreditationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/accreditations/${accreditationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accreditation_id_dmw: editForm.accreditation_id_dmw,
          principal_partner_id: editForm.principal_partner_id,
          processing_unit: editForm.processing_unit || null,
          representative: editForm.representative || null,
          date_issued: editForm.date_issued,
          date_expiration: editForm.date_expiration,
          status: editForm.status,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to update accreditation");
      setRows((prev) => prev.map((row) => (row.id === accreditationId ? { ...row, ...body } : row)));
      setEditingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Unable to update accreditation");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accreditationId: string, dmwId: string) => {
    if (!confirm(`Delete accreditation "${dmwId}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/accreditations/${accreditationId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Unable to delete accreditation");
      }
      setRows((prev) => prev.filter((row) => row.id !== accreditationId));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Unable to delete accreditation");
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (accreditationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/accreditations/${accreditationId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_issued: renewDates.date_issued,
          date_expiration: renewDates.date_expiration,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to renew accreditation");
      setRows((prev) => prev.map((row) => (row.id === accreditationId ? { ...row, ...body, status: "renewed" } : row)));
      setRenewingId(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Unable to renew accreditation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreate} className="card rounded-xl p-5">
        <h3 className="font-bold mb-4">Add Accreditation</h3>
        {error && <div className="alert alert-error text-sm mb-4" role="alert">{error}</div>}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="form-field">
            <label className="form-label">DMW Ref ID</label>
            <input required value={form.accreditation_id_dmw} onChange={(e) => setForm({ ...form, accreditation_id_dmw: e.target.value })} className="form-input" />
          </div>
          <div className="form-field">
            <label className="form-label">Principal Partner</label>
            <select required value={form.principal_partner_id} onChange={(e) => setForm({ ...form, principal_partner_id: e.target.value })} className="form-select">
              <option value="">Select partner</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Processing Unit</label>
            <input value={form.processing_unit} onChange={(e) => setForm({ ...form, processing_unit: e.target.value })} className="form-input" />
          </div>
          <div className="form-field">
            <label className="form-label">Representative</label>
            <input value={form.representative} onChange={(e) => setForm({ ...form, representative: e.target.value })} className="form-input" />
          </div>
          <div className="form-field">
            <label className="form-label">Date Issued</label>
            <input type="date" required value={form.date_issued} onChange={(e) => setForm({ ...form, date_issued: e.target.value })} className="form-input" />
          </div>
          <div className="form-field">
            <label className="form-label">Date Expiration</label>
            <input type="date" required value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} className="form-input" />
          </div>
          <div className="form-field md:col-span-2">
            <label className="form-label">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="form-select">
              <option value="active">Active</option>
              <option value="renewed">Renewed</option>
              <option value="expired_unconfirmed">Expired / Unconfirmed</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Create Accreditation"}</button>
        </div>
      </form>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>DMW Ref</th>
                <th>Principal Partner</th>
                <th>Issued / Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id}>
                  <td className="font-semibold">{row.accreditation_id_dmw}</td>
                  <td>
                    {/* Use partnerMap for reliable lookup instead of joined partner_name */}
                    {partnerMap[row.principal_partner_id] ?? row.partner_name ?? "—"}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs">{row.date_issued} → {row.date_expiration}</span>
                      <ExpiryBadge tier={row.expiry_tier} />
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{row.status}</span></td>
                  <td>
                    {editingId === row.id ? (
                      <div className="flex flex-col gap-2 min-w-[220px]">
                        <input className="form-input" value={editForm.accreditation_id_dmw} onChange={(e) => setEditForm({ ...editForm, accreditation_id_dmw: e.target.value })} placeholder="DMW Ref ID" />
                        <select className="form-select" value={editForm.principal_partner_id} onChange={(e) => setEditForm({ ...editForm, principal_partner_id: e.target.value })}>
                          <option value="">Select partner</option>
                          {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="date" className="form-input" value={editForm.date_issued} onChange={(e) => setEditForm({ ...editForm, date_issued: e.target.value })} />
                        <input type="date" className="form-input" value={editForm.date_expiration} onChange={(e) => setEditForm({ ...editForm, date_expiration: e.target.value })} />
                        <select className="form-select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}>
                          <option value="active">Active</option>
                          <option value="renewed">Renewed</option>
                          <option value="expired_unconfirmed">Expired / Unconfirmed</option>
                        </select>
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => void handleEdit(row.id)} disabled={loading}>Save</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : renewingId === row.id ? (
                      <div className="flex flex-col gap-2">
                        <input type="date" className="form-input" value={renewDates.date_issued} onChange={(e) => setRenewDates({ ...renewDates, date_issued: e.target.value })} />
                        <input type="date" className="form-input" value={renewDates.date_expiration} onChange={(e) => setRenewDates({ ...renewDates, date_expiration: e.target.value })} />
                        <div className="flex gap-2">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => void handleRenew(row.id)} disabled={loading}>Save</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenewingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                          setEditingId(row.id);
                          setEditForm({
                            accreditation_id_dmw: row.accreditation_id_dmw,
                            principal_partner_id: row.principal_partner_id,
                            processing_unit: row.processing_unit ?? "",
                            representative: row.representative ?? "",
                            date_issued: row.date_issued,
                            date_expiration: row.date_expiration,
                            status: row.status,
                          });
                        }}>Edit</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                          setRenewingId(row.id);
                          setRenewDates({ date_issued: row.date_issued, date_expiration: row.date_expiration });
                        }}>Renew</button>
                        <button type="button" className="btn btn-ghost btn-sm text-red-500" onClick={() => void handleDelete(row.id, row.accreditation_id_dmw)} disabled={loading}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
