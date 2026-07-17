"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ApplicantLoginPage() {
  const [ref, setRef] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/applicant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: ref, date_of_birth: dob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/applicant/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Phil-Apex Logo" width={80} height={80} className="rounded-full shadow-md" />
        </div>
        <h1 className="text-2xl font-black text-navy-900 tracking-tight">Applicant Portal</h1>
        <p className="text-sm text-ink-muted mt-2">Track your application status and upload missing documents.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">{error}</div>}
        
        <div>
          <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Reference Number</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. 2026-0001-A"
            className="w-full input text-lg py-3 text-center tracking-widest font-mono"
            value={ref}
            onChange={e => setRef(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Date of Birth</label>
          <input 
            type="date" 
            required 
            className="w-full input text-lg py-3 text-center text-ink-muted"
            value={dob}
            onChange={e => setDob(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full btn btn-primary text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 mt-4 font-bold"
        >
          {loading ? "Verifying..." : "Access My Dashboard"}
        </button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-xs text-ink-faint">
          Lost your Reference Number?<br/>
          Please contact the Phil-Apex processing team.
        </p>
      </div>
    </div>
  );
}