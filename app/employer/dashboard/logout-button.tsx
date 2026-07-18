"use client";
import { useRouter } from "next/navigation";

export function EmployerLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/employer/logout", { method: "POST" });
    router.push("/employer/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-xs font-bold text-slate-300 hover:text-white uppercase tracking-widest bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 px-4 py-2 rounded-xl transition-all active:scale-95"
    >
      Sign Out
    </button>
  );
}
