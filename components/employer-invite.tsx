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
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all text-primary hover:bg-primary/10"
      >
        {showDetails ? "▾ Hide Portal Access" : "▸ Portal Access"}
      </button>

      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">Email:</span>
            <span className="text-xs font-semibold text-gray-900">{email || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 w-16">Code:</span>
            <code className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-300 text-gray-900 tracking-wider select-all">
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
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-primary text-primary bg-white hover:bg-primary/5 transition-all disabled:opacity-40"
            >
              {copied ? "✓ Copied!" : "📋 Copy Credentials"}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 transition-all disabled:opacity-40"
            >
              {loading ? "Generating..." : "🔄 Regenerate Code"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
