"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/applicant/logout", { method: "POST" });
    router.push("/applicant/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition-all active:scale-95"
    >
      Sign Out
    </button>
  );
}