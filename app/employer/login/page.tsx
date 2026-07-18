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
    <div className="flex-1 flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="text-center mb-10 mt-8 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--navy)" }}>Partner Portal</h1>
          <p className="text-sm mt-2 font-medium tracking-wide uppercase" style={{ color: "var(--crimson)" }}>Phil-Apex Secure Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center font-medium backdrop-blur-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest ml-1" style={{ color: "var(--navy)" }}>Contact Email</label>
            <input 
              type="email" 
              required 
              placeholder="partner@company.com"
              className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ color: "var(--ink)" }}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest ml-1" style={{ color: "var(--navy)" }}>Access Code</label>
            <input 
              type="password" 
              required 
              placeholder="••••••"
              className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all tracking-widest font-mono"
              style={{ color: "var(--ink)" }}
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full text-white text-sm py-3.5 rounded-xl shadow-lg mt-8 font-bold transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-wider"
            style={{ background: "var(--crimson)" }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            For support, contact <a href="mailto:support@phil-apex.com" className="font-bold hover:underline" style={{ color: "var(--navy)" }}>support@phil-apex.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
