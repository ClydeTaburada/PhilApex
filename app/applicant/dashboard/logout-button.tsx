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
      className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
    >
      Log Out
    </button>
  );
}