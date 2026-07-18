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
    <div className="flex-1 flex flex-col justify-center p-8">
      
      <div className="text-center mb-12 animate-fade-in-down">
        <div className="flex justify-center mb-8 relative">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
          <Image src="/logo.png" alt="Phil-Apex Logo" width={90} height={90} className="rounded-full shadow-[0_0_40px_rgba(99,102,241,0.4)] relative z-10 border border-slate-700/50" />
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tight">Applicant Portal</h1>
        <p className="text-sm text-slate-400 mt-3 font-medium">Track your application instantly.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 bg-slate-800/40 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-slate-700/50 animate-fade-in-up">
        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium backdrop-blur-sm">{error}</div>}
        
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Reference Number</label>
          <input 
            type="text" 
            required 
            placeholder="e.g. 2026-0001-A"
            className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-100 text-lg py-4 px-5 rounded-2xl text-center tracking-widest font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
            value={ref}
            onChange={e => setRef(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Date of Birth</label>
          <input 
            type="date" 
            required 
            className="w-full bg-slate-900/60 border border-slate-700/50 text-slate-100 text-lg py-4 px-5 rounded-2xl text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner [color-scheme:dark]"
            value={dob}
            onChange={e => setDob(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-lg py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-6 font-bold transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Verifying Identity..." : "Secure Login"}
        </button>
      </form>

      <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs text-slate-500 font-medium">
          Lost your Reference Number?<br/>
          <span className="text-slate-400">Please contact the Phil-Apex processing team.</span>
        </p>
      </div>
    </div>
  );
}