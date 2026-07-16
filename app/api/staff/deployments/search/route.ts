import { NextRequest, NextResponse } from "next/server";
import { requireStaffContext } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { deploymentSearchSchema } from "@/lib/schemas";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    await requireStaffContext();
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = deploymentSearchSchema.safeParse(sp);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { q, page } = parsed.data;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = getSupabaseAdminClient();
    const { data, error, count } = await (supabase as any)
      .from("deployments")
      .select(`
        id, applicant_id, batch_id, hired_date, entry_date, deployment_end_date,
        document_status, dispatched_date,
        applicant:applicants!applicant_id(full_name, cellphone_number),
        batch:batches!batch_id(
          batch_label, job_order_id,
          job_order:job_orders!job_order_id(position, job_order_number,
            partner:foreign_partners!foreign_partner_id(name)
          )
        )
      `, { count: "exact" })
      .ilike("applicant.full_name", `%${q}%`)
      .range(from, to)
      .order("hired_date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data, total: count ?? 0, page, page_size: PAGE_SIZE });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
