"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Search, Plus, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentRequirementRow } from "@/lib/data/document-requirements";

export function RequirementsManager({ requirements }: { requirements: DocumentRequirementRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isConditional, setIsConditional] = useState(false);
  const [requiresFileUpload, setRequiresFileUpload] = useState(true);

  const filteredRequirements = useMemo(() => {
    if (!search.trim()) return requirements;
    const q = search.toLowerCase();
    return requirements.filter(
      (r) =>
        r.doc_name.toLowerCase().includes(q) ||
        (r.condition_note && r.condition_note.toLowerCase().includes(q))
    );
  }, [requirements, search]);

  const mandatoryCount = useMemo(
    () => requirements.filter((r) => !r.is_conditional).length,
    [requirements]
  );
  const conditionalCount = useMemo(
    () => requirements.filter((r) => r.is_conditional).length,
    [requirements]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    const docName = fd.get("doc_name")?.toString().trim();
    if (!docName) return;

    try {
      const res = await fetch("/api/staff/document-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_name: docName,
          requires_file_upload: requiresFileUpload,
          is_conditional: isConditional,
          condition_note: isConditional ? fd.get("condition_note")?.toString().trim() || null : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.doc_name?.[0] || data.error || "Failed to create requirement");
      }
      form.reset();
      setIsConditional(false);
      setRequiresFileUpload(true);
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
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">Applicant Requirements & Checklists</h3>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Standardized documents and verification items required from applicants across recruitment stages.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              {requirements.length} Total
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {mandatoryCount} Mandatory
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {conditionalCount} Conditional
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2" role="alert">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Requirement / Document Name <span className="text-red-500">*</span>
              </label>
              <input
                name="doc_name"
                required
                minLength={2}
                maxLength={255}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                placeholder="e.g. Tesda NC II Certificate, PSA Birth Certificate…"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Condition Note (Optional)
              </label>
              <input
                name="condition_note"
                disabled={!isConditional}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-40"
                placeholder={isConditional ? "e.g. If applying for welding positions" : "Check 'Conditional' below to enable"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresFileUpload}
                onChange={(e) => setRequiresFileUpload(e.target.checked)}
                className="accent-primary rounded"
              />
              <span>Requires File Upload</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isConditional}
                onChange={(e) => setIsConditional(e.target.checked)}
                className="accent-primary rounded"
              />
              <span>Conditional Requirement</span>
            </label>

            <div className="flex-1" />

            <Button type="submit" size="sm" loading={loading}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Requirement
            </Button>
          </div>
        </form>
      </div>

      {/* ── Active Requirements Table ─────────────────── */}
      <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Standard Requirements Directory
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              ({filteredRequirements.length} of {requirements.length})
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requirements…"
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRequirements.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              {requirements.length === 0
                ? "No document requirements found in system."
                : `No requirements matching "${search}".`}
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Requirement Name</th>
                  <th className="px-4 py-2.5">Type / Condition</th>
                  <th className="px-4 py-2.5">File Upload</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequirements.map((r, index) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                        {r.doc_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.is_conditional ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            CONDITIONAL
                          </span>
                          <span className="text-[11px] text-gray-500 truncate max-w-xs">
                            {r.condition_note || "Specific applicants only"}
                          </span>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          MANDATORY
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.requires_file_upload ? (
                        <div className="flex items-center gap-1 text-primary text-[11px] font-medium">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>File Upload Required</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Verification Only</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
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
