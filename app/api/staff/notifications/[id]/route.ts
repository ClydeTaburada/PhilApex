import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireStaffApiContext();
    const payload = await request.json();
    
    if (payload.is_read === undefined) {
      return NextResponse.json({ error: "Missing is_read flag" }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: payload.is_read })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
