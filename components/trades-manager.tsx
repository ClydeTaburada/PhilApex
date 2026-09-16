"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Factory, Search, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TradeRow } from "@/lib/data/trades";

export function TradesManager({ trades }: { trades: TradeRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTrades = useMemo(() => {
    if (!search.trim()) return trades;
    const q = search.toLowerCase();
    return trades.filter((t) => t.name.toLowerCase().includes(q));
  }, [trades, search]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const name = fd.get("name")?.toString().trim();
    if (!name) return;

    try {
      const res = await fetch("/api/staff/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
    <div className="space-y-4">
      {/* ── Top Header & Add Form Card ────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">Standardized Positions & Trades</h3>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Standardized skills used across registrations, applicant profiles, and job order requests.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {trades.length} Positions Configured
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2" role="alert">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
              Add New Position / Trade Name
            </label>
            <input
              name="name"
              required
              minLength={2}
              maxLength={255}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              placeholder="e.g. Caregiver, Welder 3G/4G, Software Engineer…"
            />
          </div>
          <Button type="submit" size="sm" loading={loading} className="w-full sm:w-auto shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Position
          </Button>
        </form>
      </div>

      {/* ── Active Positions List / Table ─────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
        {/* List Toolbar */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Active Standard Positions
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              ({filteredTrades.length} of {trades.length})
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search positions…"
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Positions Grid / Table */}
        {filteredTrades.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            {trades.length === 0
              ? "No standardized positions created yet. Add your first position above."
              : `No positions matching "${search}".`}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[480px] overflow-y-auto">
            {filteredTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-primary/40 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-gray-900 truncate">
                    {t.name}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-mono ml-2">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
