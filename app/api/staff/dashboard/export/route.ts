import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { dashboardFilterSchema } from "@/lib/schemas";
import { fetchApplicantsForCsv } from "@/lib/data/applicants";
import { csvEscape } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireStaffApiContext();

    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parsed = dashboardFilterSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid export filters" }, { status: 400 });
    }

    const rows = await fetchApplicantsForCsv(parsed.data);

    const header = [
      "reference_id",
      "full_name",
      "cellphone_number",
      "email",
      "occupation_applied",
      "source",
      "has_passport",
      "pipeline_stage",
      "created_at",
    ];

    const lines = [header.map(csvEscape).join(",")];

    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.full_name,
          row.cellphone_number,
          row.email,
          row.occupation_applied,
          row.source,
          row.has_passport,
          row.current_pipeline_stage,
          row.created_at,
        ]
          .map(csvEscape)
          .join(","),
      );
    }

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="applicants-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
