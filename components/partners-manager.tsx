"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PartnerRow } from "@/lib/data/partners";
import type { ProgramRow } from "@/lib/data/programs";

export function PartnersManager({ partners, programs }: { partners: PartnerRow[]; programs: ProgramRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    
    const selectedProgram = programs.find((p) => p.id === selectedProgramId);
    const isSSW = selectedProgram?.name?.toUpperCase().includes("SSW") ?? false;
    
    // Map checkbox to boolean. If SSW, force to true.
    let isFinalEmployer = fd.get("is_final_employer") === "true";
    if (isSSW) {
      isFinalEmployer = true;
    }

    const payload = {
      name: fd.get("name"),
      partner_type: fd.get("partner_type"),
      is_final_employer: isFinalEmployer,
      parent_partner_id: fd.get("parent_partner_id") || null,
      program_id: fd.get("program_id") || null,
      contact_name: fd.get("contact_name") || null,
      contact_phone: fd.get("contact_phone") || null,
      contact_email: fd.get("contact_email") || null,
      contact_address: fd.get("contact_address") || null,
    };

    try {
      const res = await fetch("/api/staff/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.name?.[0] || data.error || "Failed to create partner");
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
    <div className="border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gray-50/70 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 leading-tight">Add Foreign Partner Organization</h3>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Add employers, agencies, or organizations. Use "Parent Partner" to link them together in a chain.
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2" role="alert">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
              1. Organization Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={200}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g. Acme Corp / Tokyo Kyodo Kumiai"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">
                  Type of Organization <span className="text-red-500">*</span>
                </label>
                <select
                  name="partner_type"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Select a type...</option>
                  <option value="direct_employer">Direct Employer</option>
                  <option value="foreign_recruitment_agent">Foreign Recruitment Agent (FRA)</option>
                  <option value="supervising_org">Supervising Organization</option>
                  <option value="implementing_org">Implementing Organization</option>
                </select>
              </div>
            </div>
            
            {(!selectedProgramId || programs.find((p) => p.id === selectedProgramId)?.name?.toUpperCase().includes("TITP")) && (
              <div className="mt-1">
                <label className="flex items-center gap-2.5 cursor-pointer bg-primary/5 border border-primary/20 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                  <input type="checkbox" name="is_final_employer" value="true" className="w-4 h-4 accent-primary rounded" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-gray-900">This is a Direct / Final Employer</span>
                    <span className="text-[11px] text-gray-600">Check this box if this organization is the actual workplace where the applicant will be deployed.</span>
                  </div>
                </label>
              </div>
            )}
            
            {(programs.find((p) => p.id === selectedProgramId)?.name?.toUpperCase().includes("SSW")) && (
              <div className="mt-1">
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                  <span className="w-4 h-4 flex items-center justify-center bg-emerald-600 text-white rounded-full text-[10px]">
                    <Check className="w-3 h-3" />
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-emerald-900">Direct Employer (SSW)</span>
                    <span className="text-[11px] text-emerald-700">SSW partners are automatically designated as direct employers.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Hierarchy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
              2. Hierarchy & Program
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">Parent Partner (Optional)</label>
                <select
                  name="parent_partner_id"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">None (Top Level Organization)</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400">Select the supervising agency that manages this employer.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">Program (Optional)</label>
                <select
                  name="program_id"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                >
                  <option value="">None</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - {p.country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-1.5">
              3. Contact Information (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">Contact Person</label>
                <input
                  name="contact_name"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g. Kenji Sato"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-gray-600">Phone Number</label>
                <input
                  name="contact_phone"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="+81..."
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-gray-600">Email Address</label>
                <input
                  name="contact_email"
                  type="email"
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="contact@organization.jp"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" loading={loading}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Foreign Partner
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
