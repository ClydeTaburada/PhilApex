import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type StaffApiContext = {
  supabase: SupabaseClient;
  user: User;
  staff: {
    id: string;
    full_name: string;
    role: StaffRole;
  };
};

export async function requireStaffApiContext(allowedRoles?: StaffRole[]): Promise<StaffApiContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !staff) {
    throw new ApiError(403, "Access denied");
  }

  if (allowedRoles && !allowedRoles.includes(staff.role)) {
    throw new ApiError(403, "Insufficient role permissions");
  }

  return {
    supabase,
    user,
    staff,
  };
}

export function badRequestFromZod(errorMessage: string): NextResponse {
  return NextResponse.json(
    {
      error: "Invalid request data",
      details: errorMessage,
    },
    { status: 400 },
  );
}

export function safeErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    {
      error: "Unexpected server error",
    },
    { status: 500 },
  );
}
