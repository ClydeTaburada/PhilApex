"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Plus, Globe2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProgramRow } from "@/lib/data/programs";

export function ProgramsManager({ programs }: { programs: ProgramRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredPrograms = useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.toLowerCase();
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    );
  }, [programs, search]);

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
    <div className="space-y-4">
      {/* ── Top Header & Add Form Card ────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">Deployment Programs</h3>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Government and bilateral deployment frameworks (e.g. TITP, SSW, Direct Hire) and their target jurisdictions.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {programs.length} Active Programs
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2" role="alert">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Program Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                placeholder="e.g. TITP, SSW, Skilled Worker"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Target Country <span className="text-red-500">*</span>
              </label>
              <input
                name="country"
                required
                minLength={2}
                maxLength={100}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                placeholder="e.g. Japan, Germany, Canada"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Standard Duration (Years)
              </label>
              <input
                name="standard_duration_years"
                type="number"
                min={1}
                max={10}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                placeholder="e.g. 3 or 5"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" loading={loading}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Program
            </Button>
          </div>
        </form>
      </div>

      {/* ── Active Programs Table ─────────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Registered Programs Directory
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              ({filteredPrograms.length} of {programs.length})
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs or country…"
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredPrograms.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              {programs.length === 0
                ? "No deployment programs configured yet. Add your first program above."
                : `No programs matching "${search}".`}
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Program Name</th>
                  <th className="px-4 py-2.5">Country</th>
                  <th className="px-4 py-2.5">Standard Duration</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPrograms.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm">
                        {p.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Globe2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium">{p.country}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {p.standard_duration_years
                            ? `${p.standard_duration_years} Year${p.standard_duration_years > 1 ? "s" : ""}`
                            : "Flexible / Not set"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
