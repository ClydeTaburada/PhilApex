import { NextResponse } from "next/server";
import { getOpenJobOrders } from "@/lib/data/job-orders";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] });
    }

    const rows = await getOpenJobOrders();
    return NextResponse.json({ data: rows });
  } catch {
    return NextResponse.json({ error: "Unable to load open job orders" }, { status: 500 });
  }
}
