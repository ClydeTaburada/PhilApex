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
    <div className="min-h-screen bg-slate-950 flex justify-center text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-slate-900/50 min-h-screen shadow-2xl flex flex-col relative overflow-hidden backdrop-blur-xl border-x border-slate-800/50">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}