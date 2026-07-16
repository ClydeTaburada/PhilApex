"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TradeRow } from "@/lib/data/trades";

export function TradesManager({ trades }: { trades: TradeRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    
    try {
      const res = await fetch("/api/staff/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name") }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create trade");
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
    <div className="card rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-border px-5 py-4">
        <h3 className="font-bold text-lg">Manage Trades / Positions</h3>
        <p className="text-sm text-ink-muted mt-1">
          Add standardized job positions here. These will appear as dropdown options in the registration form and job order creation.
        </p>
      </div>
      
      <div className="p-5">
        {error && <div className="alert alert-error text-sm mb-4" role="alert">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
          <div className="form-field flex-1 w-full">
            <label className="form-label">Position / Trade Name</label>
            <input name="name" required minLength={2} maxLength={255} className="form-input" placeholder="e.g. Registered Nurse" />
          </div>
          <button type="submit" className="btn btn-primary whitespace-nowrap" disabled={loading}>
            {loading ? "Adding..." : "+ Add Position"}
          </button>
        </form>

        <div>
          <h4 className="font-semibold text-sm mb-3">Active Positions ({trades.length})</h4>
          {trades.length === 0 ? (
            <div className="text-sm text-ink-faint p-4 text-center border rounded-lg bg-gray-50">
              No positions added yet.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trades.map(t => (
                <div key={t.id} className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-2">
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
