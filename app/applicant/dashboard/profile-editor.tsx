"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, MapPin, Pencil, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

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
          : data.error || "Failed to save profile changes";
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
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Contact Details</p>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        {success && (
          <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Contact information updated successfully.</span>
          </div>
        )}

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-gray-400">Mobile Phone</p>
              <p className="font-semibold text-gray-900 truncate">{cellphone || "—"}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-gray-400">Email Address</p>
              <p className="font-semibold text-gray-900 truncate">{email || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-bold text-gray-400">Home Address</p>
              <p className="font-semibold text-gray-900 truncate">{address || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Edit Contact Details</p>
      </div>

      {error && (
        <div className="text-[11px] font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div>
          <label className="text-[11px] font-semibold text-gray-700 block mb-1">Mobile Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
            placeholder="09XXXXXXXXX"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-700 block mb-1">Email Address</label>
          <input
            type="email"
            value={emailVal}
            onChange={e => setEmailVal(e.target.value)}
            className="w-full bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-700 block mb-1">Home Address</label>
          <input
            type="text"
            value={addr}
            onChange={e => setAddr(e.target.value)}
            className="w-full bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
            placeholder="Complete Home Address"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-3">
        <button
          onClick={() => {
            setEditing(false);
            setPhone(cellphone);
            setEmailVal(email);
            setAddr(address);
            setError("");
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shadow-xs"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{saving ? "Saving…" : "Save Changes"}</span>
        </button>
      </div>
    </div>
  );
}
