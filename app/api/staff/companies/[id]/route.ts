import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getCompanyDetail } from "@/lib/data/companies";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffContext();
    const { id } = await params;
    const details = await getCompanyDetail(id);
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
