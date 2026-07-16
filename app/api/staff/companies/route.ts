import { NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getCompanyList } from "@/lib/data/companies";

export async function GET() {
  try {
    await requireStaffContext();
    const companies = await getCompanyList();
    return NextResponse.json(companies);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
