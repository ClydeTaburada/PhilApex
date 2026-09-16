import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Applicant Portal | Phil-Apex Placement Agency Inc.",
  description: "Track your application status and upload required overseas employment documents.",
};

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page flex-1 h-full min-h-0 w-full overflow-y-auto flex flex-col bg-slate-50/60">
      {/* ═══════════ MINIMALIST HEADER ═══════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex Placement Agency Inc."
              width={140}
              height={56}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-gray-500 border-l border-gray-200 pl-2.5">
              Applicant Portal
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link 
              href="/" 
              className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Main Website
            </Link>
            <Link 
              href="/#programs" 
              className="hidden sm:inline-block text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Programs
            </Link>
            <Link 
              href="/#process" 
              className="hidden sm:inline-block text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Recruitment Process
            </Link>
            <Link 
              href="/staff/login" 
              className="text-xs font-medium text-gray-400 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Staff
            </Link>
          </nav>
        </div>
      </header>

      {/* ═══════════ CONTENT ═══════════ */}
      <main className="flex-1 w-full min-h-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}