import { redirect } from "next/navigation";
import { StaffLoginForm } from "@/components/staff-login-form";
import { getStaffContextOrNull } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const existingSession = await getStaffContextOrNull();
    if (existingSession) {
      redirect("/staff/dashboard");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--surface)" }}
    >
      {/* Background accent */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(15,27,76,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex logo"
              width={180}
              height={72}
              className="h-auto w-[140px] mb-4"
              priority
            />
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "var(--navy)" }}>
            Staff Portal
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
            Authorized Phil-Apex personnel only
          </p>
        </div>

        {!configured ? (
          <div className="alert alert-error">
            <strong>Configuration Error:</strong> Supabase environment variables are missing. Set{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>.
          </div>
        ) : (
          <StaffLoginForm />
        )}

        <p className="mt-6 text-center text-xs" style={{ color: "var(--ink-faint)" }}>
          <Link href="/" style={{ color: "var(--navy)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
