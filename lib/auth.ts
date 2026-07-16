import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StaffContext = {
  user: User;
  staff: {
    id: string;
    full_name: string;
    role: StaffRole;
  };
};

export async function getStaffContextOrNull(): Promise<StaffContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !staff) {
    return null;
  }

  return {
    user,
    staff,
  };
}

export async function requireStaffContext(): Promise<StaffContext> {
  const context = await getStaffContextOrNull();

  if (!context) {
    redirect("/staff/login");
  }

  return context;
}
