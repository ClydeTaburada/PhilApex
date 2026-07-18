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
    <div className="flex-1 flex flex-col justify-center p-8 bg-white">
      
      <div className="text-center mb-10 animate-fade-in-down mt-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--navy)" }}>Applicant Portal</h1>
        <p className="text-sm mt-2 font-medium" style={{ color: "var(--ink-muted)" }}>Track your application instantly.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center font-medium border border-red-100">{error}</div>}
        
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider ml-1" style={{ color: "var(--navy)" }}>Reference Number</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. 2026-0001-A"
            className="w-full bg-slate-50 border border-slate-200 text-lg py-4 px-5 rounded-2xl text-center tracking-widest font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all"
            style={{ color: "var(--ink)", focusRingColor: "var(--crimson)" }}
            value={ref}
            onChange={e => setRef(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider ml-1" style={{ color: "var(--navy)" }}>Date of Birth</label>
          <input 
            type="date" 
            required 
            className="w-full bg-slate-50 border border-slate-200 text-lg py-4 px-5 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 transition-all"
            style={{ color: "var(--ink)", focusRingColor: "var(--crimson)" }}
            value={dob}
            onChange={e => setDob(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full text-white text-lg py-4 rounded-2xl shadow-lg mt-6 font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
          style={{ background: "var(--crimson)" }}
        >
          {loading ? "Verifying..." : "Secure Login"}
        </button>
      </form>

      <div className="mt-12 text-center animate-fade-in-up">
        <p className="text-xs font-medium" style={{ color: "var(--ink-muted)" }}>
          Lost your Reference Number?<br/>
          <span style={{ color: "var(--ink)" }}>Please contact our processing team.</span>
        </p>
      </div>
    </div>
  );
}