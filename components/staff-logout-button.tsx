"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function StaffLogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogout = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
      router.replace("/staff/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultClasses = "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 w-full disabled:opacity-50";

  return (
    <button
      id="staff-logout"
      type="button"
      onClick={onLogout}
      disabled={isSubmitting}
      className={className || defaultClasses}
    >
      <LogOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="truncate">{isSubmitting ? "Signing out…" : "Sign Out"}</span>
    </button>
  );
}
