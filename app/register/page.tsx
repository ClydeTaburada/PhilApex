import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: "none" }}>
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex logo"
              width={120}
              height={48}
              className="h-8 w-auto"
            />
            <span
              className="hidden sm:block text-sm font-semibold"
              style={{ color: "var(--navy)" }}
            >
              Applicant Registration
            </span>
          </Link>
          <Link
            href="/"
            className="btn btn-ghost btn-sm"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--navy)" }}>
            Applicant Registration
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            Complete this form accurately. Your submitted details and files are securely handled
            by Phil-Apex Placement Agency Inc.
          </p>
        </div>
        <RegisterForm />
      </main>
    </div>
  );
}
