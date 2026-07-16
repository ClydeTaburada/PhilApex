import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getCompanyDetail } from "@/lib/data/companies";
import { getPartnerById } from "@/lib/data/partners";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaffContext();
    const { id } = await params;
    const [partner, details] = await Promise.all([
      getPartnerById(id),
      getCompanyDetail(id),
    ]);

    if (!partner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generate CSV
    const header = [
      "Applicant Name",
      "Batch Label",
      "Job Order #",
      "Position",
      "Hired Date",
      "Entry Date",
      "Status",
      "Deployment End Date"
    ].join(",");

    const rows = details.map((d) => [
      `"${(d.applicant_name ?? "").replace(/"/g, '""')}"`,
      `"${(d.batch_label ?? "").replace(/"/g, '""')}"`,
      `"${(d.job_order_number ?? "").replace(/"/g, '""')}"`,
      `"${(d.position ?? "").replace(/"/g, '""')}"`,
      d.hired_date,
      d.entry_date ?? "",
      d.document_status,
      d.deployment_end_date ?? ""
    ].join(","));

    const csvContent = [header, ...rows].join("\n");
    
    // Sanitize filename
    const safeName = partner.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}_employees.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
