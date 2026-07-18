import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Portal | Phil-Apex",
  description: "Manage and monitor your deployments.",
};

import Image from "next/image";
import Link from "next/link";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page" style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a2d6d 50%, var(--crimson) 100%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* ═══════════ HEADER (MATCHES LANDING PAGE) ═══════════ */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link href="/" className="landing-logo-link">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex Placement Agency Inc."
              width={160}
              height={64}
              className="landing-logo-img"
              priority
            />
          </Link>
          <nav className="landing-nav">
            <Link href="/#about" className="landing-nav-link">About</Link>
            <Link href="/#programs" className="landing-nav-link">Programs</Link>
            <Link href="/#process" className="landing-nav-link">Process</Link>
            <Link href="/#contact" className="landing-nav-link">Contact</Link>
            <Link href="/staff/login" className="landing-nav-link" style={{ color: "var(--ink-faint)" }}>Staff</Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col relative z-10 w-full" style={{ marginTop: "70px", minHeight: "calc(100vh - 70px)" }}>
        {children}
      </main>
    </div>
  );
}
