import { NextResponse } from "next/server";
import { requireStaffApiContext, safeErrorResponse } from "@/lib/api";
import { upsertJobOrderSchema } from "@/lib/schemas";
import { getAllJobOrders } from "@/lib/data/job-orders";

export async function GET() {
  try {
    await requireStaffApiContext();
    const data = await getAllJobOrders();
    return NextResponse.json({ data });
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireStaffApiContext(["processing_officer", "admin"]);

    const payload = await request.json();
    const parsed = upsertJobOrderSchema.safeParse(payload);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid job order payload";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const slotsTotal = parsed.data.slots_total ?? parsed.data.manpower_requested ?? 1;
    const slotsFilled = parsed.data.slots_filled ?? 0;

    if (slotsFilled > slotsTotal) {
      return NextResponse.json({ error: "Slots filled cannot exceed slots required." }, { status: 400 });
    }

    const mutationPayload = {
      job_order_number: parsed.data.job_order_number ?? null,
      accreditation_id: parsed.data.accreditation_id ?? null,
      foreign_partner_id: parsed.data.foreign_partner_id ?? null,
      position: parsed.data.position ?? null,
      class: parsed.data.class ?? null,
      manpower_requested: parsed.data.manpower_requested ?? null,
      jo_validity_date: parsed.data.jo_validity_date ?? null,
      country: parsed.data.country ?? null,
      program_name: parsed.data.program_name ?? null,
      trade: parsed.data.trade ?? null,
      gender_requirement: parsed.data.gender_requirement ?? null,
      slots_total: slotsTotal,
      slots_filled: slotsFilled,
    };

    if (parsed.data.id) {
      const { data, error } = await supabase
        .from("job_orders")
        .update(mutationPayload)
        .eq("id", parsed.data.id)
        .select("id, job_order_number, position, class, manpower_requested, jo_validity_date, country, program_name, trade, gender_requirement, slots_total, slots_filled, status, created_at")
        .single();

      if (error) {
        return NextResponse.json({ error: "Unable to update job order" }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    const { data, error } = await supabase
      .from("job_orders")
      .insert(mutationPayload)
      .select("id, job_order_number, position, class, manpower_requested, jo_validity_date, country, program_name, trade, gender_requirement, slots_total, slots_filled, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Unable to create job order" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
