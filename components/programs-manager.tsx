"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProgramRow } from "@/lib/data/programs";

export function ProgramsManager({ programs }: { programs: ProgramRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const duration = fd.get("standard_duration_years")?.toString();
    const payload = {
      name: fd.get("name"),
      country: fd.get("country"),
      standard_duration_years: duration ? parseInt(duration, 10) : null,
    };

    try {
      const res = await fetch("/api/staff/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.name?.[0] || data.error || "Failed to create program");
      }
      form.reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gray-50 border-b border-border px-5 py-4">
        <h3 className="font-bold text-lg">Manage Programs</h3>
        <p className="text-sm text-ink-muted mt-1">
          Add deployment programs (like TITP, SSW) and their target countries.
        </p>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {error && <div className="alert alert-error text-sm mb-4" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="form-label">Program Name</label>
              <input name="name" required minLength={2} maxLength={120} className="form-input" placeholder="e.g. TITP" />
            </div>
            <div className="form-field">
              <label className="form-label">Country</label>
              <input name="country" required minLength={2} maxLength={100} className="form-input" placeholder="e.g. Japan" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Standard Duration (Years)</label>
            <input name="standard_duration_years" type="number" min={1} max={10} className="form-input" placeholder="Leave blank if unknown" />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Adding..." : "+ Add Program"}
            </button>
          </div>
        </form>

        <div className="mt-auto">
          <h4 className="font-semibold text-sm mb-3">Active Programs ({programs.length})</h4>
          {programs.length === 0 ? (
            <div className="text-sm text-ink-faint p-4 text-center border rounded-lg bg-gray-50">
              No programs added yet.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {programs.map(p => (
                <div key={p.id} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2">
                  {p.name} - {p.country}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
