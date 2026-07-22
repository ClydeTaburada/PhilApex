"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  applicantId: string;
  cellphone: string;
  email: string;
  address: string;
};

export function ProfileEditor({ applicantId, cellphone, email, address }: Props) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(cellphone);
  const [emailVal, setEmailVal] = useState(email);
  const [addr, setAddr] = useState(address);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/applicant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellphone_number: phone,
          email: emailVal,
          home_address: addr,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errMsg = typeof data.error === "object"
          ? Object.values(data.error).flat().join(", ")
          : data.error || "Failed to save";
        throw new Error(errMsg);
      }

      setSuccess(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-navy">Contact Information</p>
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-navy border border-navy/20 bg-navy/5 hover:bg-navy/10"
          >
            ✏️ Edit
          </button>
        </div>
        {success && (
          <div className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-2 rounded-xl mb-4 text-center border border-green-200 shadow-sm animate-pulse">
            ✓ Contact info updated successfully
          </div>
        )}
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-navy">📞</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Phone Number</p>
                <p className="font-bold text-ink">{cellphone}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-3 w-full">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-navy">✉️</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Email Address</p>
                <p className="font-bold text-ink truncate" title={email || ""}>{email || "—"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center gap-3 w-full">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-navy">📍</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Home Address</p>
                <p className="font-medium text-ink truncate" title={address || ""}>{address || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-navy">Edit Contact Information</p>
      </div>

      {error && (
        <div className="text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-200 mb-4">{error}</div>
      )}

      <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1.5 text-ink-faint ml-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-white border border-slate-200 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all shadow-sm"
            placeholder="09XXXXXXXXX"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1.5 text-ink-faint ml-1">Email Address</label>
          <input
            type="email"
            value={emailVal}
            onChange={e => setEmailVal(e.target.value)}
            className="w-full bg-white border border-slate-200 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all shadow-sm"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1.5 text-ink-faint ml-1">Home Address</label>
          <input
            type="text"
            value={addr}
            onChange={e => setAddr(e.target.value)}
            className="w-full bg-white border border-slate-200 py-2.5 px-4 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all shadow-sm"
            placeholder="Full Home Address"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-5">
        <button
          onClick={() => {
            setEditing(false);
            setPhone(cellphone);
            setEmailVal(email);
            setAddr(address);
            setError("");
          }}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:shadow-sm active:scale-95 text-ink-muted"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl text-white transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 shadow-sm bg-crimson"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
