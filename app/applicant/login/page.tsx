"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Calendar, Hash, Phone, Mail, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [ref, setRef] = useState(initialRef);
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialRef && !ref) {
      setRef(initialRef.toUpperCase());
    }
  }, [initialRef, ref]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cleanRef = ref.trim().toUpperCase();
    const cleanDob = dob.trim();

    try {
      const res = await fetch("/api/applicant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference_number: cleanRef, date_of_birth: cleanDob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login verification failed. Please check your details.");
      router.push("/applicant/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Reference Number */}
      <div className="space-y-1.5">
        <label className="flex items-center justify-between text-xs font-semibold text-gray-700">
          <span>Reference Number</span>
          <span className="text-[10px] text-gray-400 font-normal">e.g. 2026-0001-A</span>
        </label>
        <div className="relative">
          <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="2026-XXXX-X or UUID"
            className="w-full pl-9 pr-3.5 py-2 text-xs font-mono uppercase tracking-wider bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-700">
          Date of Birth
        </label>
        <div className="relative">
          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            required
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-900"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Verifying Credentials…</span>
          </>
        ) : (
          <>
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ApplicantLoginPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Applicant Portal
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Track your deployment milestones and submit required documentation securely.
            </p>
          </div>

          {/* Form with Suspense for useSearchParams */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }>
            <LoginForm />
          </Suspense>

          {/* Help Box */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500">
              Lost your Reference Number or need help?
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-primary font-semibold">
              <a href="tel:+634326811" className="inline-flex items-center gap-1 hover:underline">
                <Phone className="w-3 h-3 text-gray-400" />
                <span>(+63) 432-6811</span>
              </a>
              <span>•</span>
              <a href="mailto:philapexbacolod@gmail.com" className="inline-flex items-center gap-1 hover:underline">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>Email Support</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-[10px] text-gray-400">
          <p>Licensed by Department of Migrant Workers (DMW-514-LB-08132024-R)</p>
          <p className="mt-0.5">Phil-Apex Placement Agency Inc. • Bacolod City, Philippines</p>
        </div>
      </div>
    </div>
  );
}