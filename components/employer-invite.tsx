"use client";

import { useState } from "react";

type Props = {
  partnerId: string;
  partnerName: string;
  contactEmail: string | null;
  accessCode: string;
  isAdmin: boolean;
};

export function EmployerInvite({ partnerId, partnerName, contactEmail, accessCode, isAdmin }: Props) {
  const [code, setCode] = useState(accessCode);
  const [email, setEmail] = useState(contactEmail || "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRegenerate = async () => {
    if (!confirm(`This will generate a new access code for "${partnerName}". The old code will stop working immediately. Continue?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/staff/partners/${partnerId}/regenerate-code`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCode(data.access_code);
      if (data.contact_email) setEmail(data.contact_email);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = `Phil-Apex Partner Portal Login\n\nURL: ${window.location.origin}/employer/login\nEmail: ${email}\nAccess Code: ${code}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all hover:bg-blue-50"
        style={{ color: "var(--navy)" }}
      >
        {showDetails ? "▾ Hide Portal Access" : "▸ Portal Access"}
      </button>

      {showDetails && (
        <div className="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-800 w-16">Email:</span>
            <span className="text-xs font-medium text-blue-900">{email || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-800 w-16">Code:</span>
            <code className="text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-blue-200 text-blue-900 tracking-widest select-all">
              {code}
            </code>
          </div>
          {!email && (
            <p className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
              ⚠ No contact email set — employer cannot log in until you add one via the form above.
            </p>
          )}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCopy}
              disabled={!email}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-all hover:shadow-sm disabled:opacity-40 active:scale-95"
              style={{ color: "var(--navy)", borderColor: "var(--navy)", background: "white" }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Credentials"}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border transition-all hover:shadow-sm disabled:opacity-40 active:scale-95 text-amber-700 border-amber-300 bg-white"
            >
              {loading ? "Generating..." : "🔄 Regenerate Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
