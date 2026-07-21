"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StaffMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  processing_officer: "Processing Officer",
  front_desk: "Front Desk",
};

export function TeamManager({ initialTeam, currentUserId }: { initialTeam: StaffMember[]; currentUserId: string }) {
  const router = useRouter();
  const [team, setTeam] = useState(initialTeam);
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/staff/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fd.get("full_name"),
          email: fd.get("email"),
          password: fd.get("password"),
          role: fd.get("role"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create staff member");
      }

      setIsAddOpen(false);
      router.refresh();
      // Optimistic update could go here, but refresh is safer to get the exact data back
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;

    const payload: any = {
      full_name: fd.get("full_name"),
      role: fd.get("role"),
    };
    if (password) payload.password = password;

    try {
      const res = await fetch(`/api/staff/team/${editingStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update staff member");
      }

      setEditingStaff(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    if (staff.id === currentUserId) {
      alert("You cannot deactivate your own account.");
      return;
    }

    const newStatus = !staff.is_active;
    const action = newStatus ? "reactivate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} ${staff.full_name}?`)) return;

    try {
      const res = await fetch(`/api/staff/team/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} staff member`);
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--navy)" }}>Agency Staff</h2>
          <p className="text-sm text-ink-muted">Manage internal team members and their roles</p>
        </div>
        <button
          onClick={() => { setError(null); setIsAddOpen(true); }}
          className="btn btn-primary"
        >
          + Add Staff Member
        </button>
      </div>

      <div className="card rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialTeam.map((staff) => (
                <tr key={staff.id} className={!staff.is_active ? "bg-slate-50/50 opacity-75" : ""}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-bold" style={{ color: "var(--ink)" }}>{staff.full_name}</span>
                      <span className="text-[10px] text-ink-muted mt-0.5">{staff.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs uppercase tracking-wide font-medium px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                      {ROLE_LABELS[staff.role] || staff.role}
                    </span>
                  </td>
                  <td>
                    {staff.is_active ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-gray">Deactivated</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-ink-muted">
                      {staff.last_sign_in_at ? new Date(staff.last_sign_in_at).toLocaleDateString() : "Never"}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setError(null); setEditingStaff(staff); }}
                        className="text-xs font-bold uppercase px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        style={{ color: "var(--navy)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(staff)}
                        disabled={staff.id === currentUserId}
                        className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          staff.is_active
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {staff.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialTeam.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-ink-muted">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD MODAL ────────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-lg" style={{ color: "var(--navy)" }}>Add Staff Member</h3>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {error && <div className="alert alert-error text-sm">{error}</div>}
              
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input name="full_name" required className="form-input" placeholder="e.g. Jane Doe" />
              </div>
              <div className="form-field">
                <label className="form-label">Email Address</label>
                <input name="email" type="email" required className="form-input" placeholder="jane@phil-apex.com" />
              </div>
              <div className="form-field">
                <label className="form-label">Temporary Password</label>
                <input name="password" type="password" required minLength={6} className="form-input" placeholder="Min. 6 characters" />
              </div>
              <div className="form-field">
                <label className="form-label">Role</label>
                <select name="role" required className="form-select">
                  <option value="front_desk">Front Desk</option>
                  <option value="processing_officer">Processing Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Creating..." : "Create Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ───────────────────────────────────── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg" style={{ color: "var(--navy)" }}>Edit Staff Member</h3>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-slate-500">{editingStaff.email}</span>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && <div className="alert alert-error text-sm">{error}</div>}
              
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input name="full_name" defaultValue={editingStaff.full_name} required className="form-input" />
              </div>
              <div className="form-field">
                <label className="form-label">Role</label>
                <select name="role" defaultValue={editingStaff.role} required className="form-select" disabled={editingStaff.id === currentUserId}>
                  <option value="front_desk">Front Desk</option>
                  <option value="processing_officer">Processing Officer</option>
                  <option value="admin">Administrator</option>
                </select>
                {editingStaff.id === currentUserId && (
                  <p className="text-[10px] text-amber-600 mt-1">You cannot change your own role.</p>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--navy)" }}>Security</p>
                <div className="form-field">
                  <label className="form-label">Reset Password <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input name="password" type="password" minLength={6} className="form-input" placeholder="Leave blank to keep current" />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-2">
                <button type="button" onClick={() => setEditingStaff(null)} className="btn bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
