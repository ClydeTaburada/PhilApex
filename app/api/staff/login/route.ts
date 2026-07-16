import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("id, full_name, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!staff) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Staff account is not provisioned" }, { status: 403 });
    }

    return NextResponse.json({
      data: {
        id: staff.id,
        full_name: staff.full_name,
        role: staff.role,
      },
    });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
