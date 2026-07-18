"use client";

import { useState } from "react";
import type { DeploymentRow } from "@/lib/data/batches";
import type { StaffRole } from "@/lib/schemas";

type Props = {
  deployments: DeploymentRow[];
  staffRole: StaffRole;
  onUpdate: (id: string, updates: Partial<DeploymentRow>) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
};

export function DeploymentTable({ deployments, staffRole, onUpdate, onRemove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<DeploymentRow>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canEdit = staffRole === "admin" || staffRole === "processing_officer";

  const handleEdit = (d: DeploymentRow) => {
    setEditingId(d.id);
    setEditValues({
      hired_date: d.hired_date,
      entry_date: d.entry_date ?? "",
      deployment_end_date: d.deployment_end_date ?? "",
      document_status: d.document_status,
      dispatched_date: d.dispatched_date ?? "",
      visa_status: d.visa_status,
      oec_number: d.oec_number ?? "",
      flight_airline: d.flight_airline ?? "",
      flight_number: d.flight_number ?? "",
      departure_datetime: d.departure_datetime ?? "",
    });
  };

  const handleSave = async (id: string) => {
    setLoadingId(id);
    const success = await onUpdate(id, {
      ...editValues,
      entry_date: editValues.entry_date || null,
      deployment_end_date: editValues.deployment_end_date || null,
      dispatched_date: editValues.dispatched_date || null,
      oec_number: editValues.oec_number || null,
      flight_airline: editValues.flight_airline || null,
      flight_number: editValues.flight_number || null,
      departure_datetime: editValues.departure_datetime || null,
    });
    setLoadingId(null);
    if (success) setEditingId(null);
  };

  if (deployments.length === 0) {
    return <div className="text-sm text-ink-faint p-4">No deployments in this batch yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Hired Date</th>
            <th>Status</th>
            <th>Visa & OEC</th>
            <th>Flight Info</th>
            <th>Entry Date</th>
            <th>End Date</th>
            {canEdit && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {deployments.map((d) => {
            const isEditing = editingId === d.id;
            return (
              <tr key={d.id}>
                <td>
                  <span className="font-medium">{d.applicant_name}</span>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      className="form-input p-1 text-xs"
                      value={editValues.hired_date || ""}
                      onChange={(e) => setEditValues({ ...editValues, hired_date: e.target.value })}
                    />
                  ) : (
                    d.hired_date
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <select
                        className="form-select p-1 text-xs"
                        value={editValues.document_status || "on_process"}
                        onChange={(e) => setEditValues({ ...editValues, document_status: e.target.value as any })}
                      >
                        <option value="on_process">On Process</option>
                        <option value="dispatched">Dispatched</option>
                      </select>
                      {editValues.document_status === "dispatched" && (
                        <input
                          type="date"
                          className="form-input p-1 text-xs"
                          placeholder="Dispatched Date"
                          value={editValues.dispatched_date || ""}
                          onChange={(e) => setEditValues({ ...editValues, dispatched_date: e.target.value })}
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      {d.document_status === "on_process" ? (
                        <span className="badge badge-amber">On Process</span>
                      ) : (
                        <span className="badge badge-green">Dispatched</span>
                      )}
                      {d.dispatched_date && <div className="text-[10px] text-ink-muted mt-0.5">{d.dispatched_date}</div>}
                    </div>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <select
                        className="form-select p-1 text-xs"
                        value={editValues.visa_status || "pending"}
                        onChange={(e) => setEditValues({ ...editValues, visa_status: e.target.value as any })}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                      </select>
                      <input
                        type="text"
                        className="form-input p-1 text-xs uppercase"
                        placeholder="OEC Number"
                        value={editValues.oec_number || ""}
                        onChange={(e) => setEditValues({ ...editValues, oec_number: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className={`badge ${d.visa_status === 'approved' ? 'badge-green' : d.visa_status === 'denied' ? 'badge-red' : 'badge-amber'}`}>
                        {d.visa_status?.toUpperCase() || 'PENDING'}
                      </span>
                      {d.oec_number && <span className="text-[10px] text-ink-muted mt-0.5 font-mono">{d.oec_number}</span>}
                    </div>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="flex flex-col gap-1 w-32">
                      <input
                        type="text"
                        className="form-input p-1 text-xs"
                        placeholder="Airline (e.g. PAL)"
                        value={editValues.flight_airline || ""}
                        onChange={(e) => setEditValues({ ...editValues, flight_airline: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input p-1 text-xs"
                        placeholder="Flight #"
                        value={editValues.flight_number || ""}
                        onChange={(e) => setEditValues({ ...editValues, flight_number: e.target.value })}
                      />
                      <input
                        type="datetime-local"
                        className="form-input p-1 text-[10px]"
                        value={editValues.departure_datetime ? new Date(editValues.departure_datetime).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setEditValues({ ...editValues, departure_datetime: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {(d.flight_airline || d.flight_number) ? (
                        <span className="font-medium text-[11px] whitespace-nowrap">{d.flight_airline} {d.flight_number}</span>
                      ) : <span className="text-ink-faint">—</span>}
                      {d.departure_datetime && <span className="text-[10px] text-ink-muted mt-0.5 whitespace-nowrap">{new Date(d.departure_datetime).toLocaleString()}</span>}
                    </div>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      className="form-input p-1 text-xs"
                      value={editValues.entry_date || ""}
                      onChange={(e) => setEditValues({ ...editValues, entry_date: e.target.value })}
                    />
                  ) : (
                    d.entry_date ?? <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      className="form-input p-1 text-xs"
                      value={editValues.deployment_end_date || ""}
                      onChange={(e) => setEditValues({ ...editValues, deployment_end_date: e.target.value })}
                    />
                  ) : (
                    d.deployment_end_date ?? <span className="text-ink-faint text-xs">Active</span>
                  )}
                </td>
                {canEdit && (
                  <td className="text-right whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingId(null)}
                          disabled={loadingId === d.id}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void handleSave(d.id)}
                          disabled={loadingId === d.id}
                        >
                          {loadingId === d.id ? "Saving..." : "Save"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-xs"
                          onClick={() => handleEdit(d)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-text btn-sm"
                          onClick={() => {
                            if (confirm(`Remove ${d.applicant_name} from this batch?`)) {
                              void onRemove(d.id);
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
