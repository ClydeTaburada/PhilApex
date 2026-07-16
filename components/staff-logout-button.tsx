"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StaffLogoutButton() {
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

  return (
    <button
      id="staff-logout"
      type="button"
      onClick={onLogout}
      disabled={isSubmitting}
      className="btn btn-danger-text w-full justify-start"
    >
      {isSubmitting ? "Signing out…" : "↩ Sign out"}
    </button>
  );
}
