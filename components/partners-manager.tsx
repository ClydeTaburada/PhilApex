"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PartnerRow } from "@/lib/data/partners";
import type { ProgramRow } from "@/lib/data/programs";

export function PartnersManager({ partners, programs }: { partners: PartnerRow[]; programs: ProgramRow[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError(null);
    const fd = new FormData(form);
    
    // Map checkbox to boolean
    const isFinalEmployer = fd.get("is_final_employer") === "true";

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
    <div className="card rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gray-50 border-b border-border px-5 py-4">
        <h3 className="font-bold text-lg">Manage Foreign Partners</h3>
        <p className="text-sm text-ink-muted mt-1">
          Add employers, agencies, or organizations. Use "Parent Partner" to link them together in a chain.
        </p>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        {error && <div className="alert alert-error text-sm mb-4" role="alert">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-2">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm border-b pb-2">1. Organization Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-label">Name <span className="text-crimson">*</span></label>
                <input name="name" required minLength={2} maxLength={200} className="form-input" placeholder="e.g. Acme Corp" />
              </div>
              <div className="form-field">
                <label className="form-label">Type of Organization <span className="text-crimson">*</span></label>
                <select name="partner_type" required className="form-select">
                  <option value="">Select a type...</option>
                  <option value="direct_employer">Direct Employer</option>
                  <option value="foreign_recruitment_agent">Foreign Recruitment Agent (FRA)</option>
                  <option value="supervising_org">Supervising Organization</option>
                  <option value="implementing_org">Implementing Organization</option>
                </select>
              </div>
            </div>
            
            <div className="form-field">
              <label className="flex items-center gap-2 cursor-pointer bg-blue-50 border border-blue-100 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                <input type="checkbox" name="is_final_employer" value="true" className="w-5 h-5 accent-blue-600 rounded" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-blue-900">This is a Final Employer</span>
                  <span className="text-xs text-blue-700">Check this box if this organization is the actual workplace where the applicant will be deployed.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Hierarchy */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm border-b pb-2">2. Hierarchy & Program</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-label text-ink">Parent Partner (Optional)</label>
                <select name="parent_partner_id" className="form-select">
                  <option value="">None (Top Level Organization)</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-ink-muted mt-1">Select the agency that manages this employer.</p>
              </div>
              <div className="form-field">
                <label className="form-label text-ink">Program (Optional)</label>
                <select name="program_id" className="form-select">
                  <option value="">None</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm border-b pb-2">3. Contact Information (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-label">Contact Person</label>
                <input name="contact_name" className="form-input" placeholder="Name" />
              </div>
              <div className="form-field">
                <label className="form-label">Phone Number</label>
                <input name="contact_phone" className="form-input" placeholder="+1..." />
              </div>
              <div className="form-field col-span-2">
                <label className="form-label">Email</label>
                <input name="contact_email" type="email" className="form-input" placeholder="email@example.com" />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Adding Partner..." : "+ Add Foreign Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
