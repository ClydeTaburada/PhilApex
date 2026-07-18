import { NextResponse } from "next/server";
import { clearEmployerSession } from "@/lib/employer-auth";

export async function POST() {
  await clearEmployerSession();
  return NextResponse.json({ ok: true });
}
