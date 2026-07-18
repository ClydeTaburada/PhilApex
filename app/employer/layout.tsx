import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Portal | Phil-Apex",
  description: "Manage and monitor your deployments.",
};

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans selection:bg-teal-500/30">
      {/* Subtle background glow for enterprise feel */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-[120px]" />
      </div>
      
      <main className="flex-1 flex flex-col relative z-10 w-full">
        {children}
      </main>
    </div>
  );
}
