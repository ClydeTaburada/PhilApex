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
    });
  };

  const handleSave = async (id: string) => {
    setLoadingId(id);
    const success = await onUpdate(id, {
      ...editValues,
      entry_date: editValues.entry_date || null,
      deployment_end_date: editValues.deployment_end_date || null,
      dispatched_date: editValues.dispatched_date || null,
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
