import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getDeploymentMonitoringRows } from "@/lib/data/deployments";

export async function GET(req: NextRequest) {
  try {
    await requireStaffContext();
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const rows = await getDeploymentMonitoringRows(q || undefined);

    const header = [
      "Applicant Name",
      "Batch Label",
      "Job Order #",
      "Position",
      "Company/Partner",
      "Program",
      "Country",
      "Hired Date",
      "Entry Date",
      "End Date",
      "Document Status",
      "Dispatched Date",
    ].join(",");

    const body = rows.map((row) => [
      `"${(row.applicant_name ?? "").replace(/"/g, '""')}"`,
      `"${(row.batch_label ?? "").replace(/"/g, '""')}"`,
      `"${(row.job_order_number ?? "").replace(/"/g, '""')}"`,
      `"${(row.position ?? "").replace(/"/g, '""')}"`,
      `"${(row.foreign_partner_name ?? "").replace(/"/g, '""')}"`,
      `"${(row.program_name ?? "").replace(/"/g, '""')}"`,
      `"${(row.country ?? "").replace(/"/g, '""')}"`,
      row.hired_date,
      row.entry_date ?? "",
      row.deployment_end_date ?? "",
      row.document_status,
      row.dispatched_date ?? "",
    ].join(","));

    return new NextResponse([header, ...body].join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="deployment_monitoring.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
