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
      <div className="border-t border-slate-100 pt-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>Contact Information</p>
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all hover:shadow-sm active:scale-95"
            style={{ color: "var(--navy)", background: "rgba(20,48,120,0.06)", border: "1px solid rgba(20,48,120,0.12)" }}
          >
            ✏️ Edit
          </button>
        </div>
        {success && (
          <div className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg mb-2 text-center border border-green-100">
            ✓ Contact info updated successfully
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Phone</p>
            <p className="font-medium" style={{ color: "var(--ink)" }}>{cellphone}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Email</p>
            <p className="font-medium" style={{ color: "var(--ink)" }}>{email || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>Address</p>
            <p className="font-medium" style={{ color: "var(--ink)" }}>{address || "—"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-3 mt-1 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--ink-faint)" }}>Edit Contact Information</p>

      {error && (
        <div className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: "var(--ink-faint)" }}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            placeholder="09XXXXXXXXX"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: "var(--ink-faint)" }}>Email</label>
          <input
            type="email"
            value={emailVal}
            onChange={e => setEmailVal(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            placeholder="you@email.com"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wide block mb-1" style={{ color: "var(--ink-faint)" }}>Address</label>
          <input
            type="text"
            value={addr}
            onChange={e => setAddr(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            placeholder="Home address"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setEditing(false);
            setPhone(cellphone);
            setEmailVal(email);
            setAddr(address);
            setError("");
          }}
          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95"
          style={{ color: "var(--ink-muted)" }}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm"
          style={{ background: "var(--crimson)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
