import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Background accent */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15,27,76,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="card inline-flex items-center px-5 py-3 mb-6 rounded-2xl">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex Placement Agency Inc. logo"
              width={220}
              height={88}
              className="h-auto w-[160px] md:w-[220px]"
              priority
            />
          </div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: "var(--crimson)" }}
          >
            Phil-Apex Placement Agency Inc.
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: "var(--navy)" }}
          >
            Applicant Management System
          </h1>
          <p className="mt-3 max-w-lg text-sm md:text-base" style={{ color: "var(--ink-muted)" }}>
            Securely captures applicant records, document status, and staff-driven
            processing updates for overseas placement operations.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Applicant Registration */}
          <Link
            href="/register"
            id="cta-register"
            className="card group flex flex-col gap-3 p-6 rounded-2xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
            style={{ textDecoration: "none" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{ background: "var(--crimson)" }}
            >
              ✍
            </div>
            <div>
              <p className="font-700 text-base font-bold" style={{ color: "var(--ink)" }}>
                Applicant Registration
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                Submit your application and required documents to Phil-Apex.
              </p>
            </div>
            <span
              className="mt-auto inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--crimson)" }}
            >
              Register now →
            </span>
          </Link>

          {/* Staff Login */}
          <Link
            href="/staff/login"
            id="cta-staff-login"
            className="card group flex flex-col gap-3 p-6 rounded-2xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
            style={{ textDecoration: "none" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{ background: "var(--navy)" }}
            >
              🔒
            </div>
            <div>
              <p className="font-700 text-base font-bold" style={{ color: "var(--ink)" }}>
                Staff Portal
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
                Authorized Phil-Apex personnel only. Manage applicants and job orders.
              </p>
            </div>
            <span
              className="mt-auto inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: "var(--navy)" }}
            >
              Sign in →
            </span>
          </Link>
        </div>

        {/* Trust note */}
        <p className="mt-8 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
          Phil-Apex Placement Agency Inc. does not collect placement fees from applicants.
        </p>
      </div>
    </main>
  );
}
