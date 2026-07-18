import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Applicant Portal | Phil-Apex",
  description: "Track your application status and upload missing documents.",
};

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex justify-center font-sans selection:bg-crimson/30" style={{ background: "var(--surface)", color: "var(--ink)" }}>
      <div className="w-full max-w-md min-h-screen flex flex-col relative overflow-hidden bg-white shadow-xl border-x" style={{ borderColor: "var(--border)" }}>
        
        {/* Subtle Brand Accents */}
        <div className="absolute top-0 w-full h-1" style={{ background: "var(--crimson)" }} />
        
        <main className="flex-1 flex flex-col relative z-10 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}