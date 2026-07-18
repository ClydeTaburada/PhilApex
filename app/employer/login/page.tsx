"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EmployerLoginPage() {
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, access_code: accessCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/employer/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl p-10 rounded-[2rem] shadow-2xl border border-slate-700/50 relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 blur-2xl rounded-full" />
        
        <div className="text-center mb-10 relative z-10">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo" width={64} height={64} className="rounded-full shadow-lg border border-slate-700" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Partner Portal</h1>
          <p className="text-sm text-teal-400/80 mt-2 font-medium tracking-wide uppercase">Phil-Apex Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium backdrop-blur-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
            <input 
              type="email" 
              required 
              placeholder="partner@company.com"
              className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-100 py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-inner"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Code</label>
            <input 
              type="password" 
              required 
              placeholder="••••••"
              className="w-full bg-slate-950/50 border border-slate-700/50 text-slate-100 py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-inner tracking-widest font-mono"
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white text-sm py-3.5 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.2)] mt-8 font-bold transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-wider"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-xs text-slate-500">
            For support, contact <a href="mailto:support@phil-apex.com" className="text-teal-400 hover:underline">support@phil-apex.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
