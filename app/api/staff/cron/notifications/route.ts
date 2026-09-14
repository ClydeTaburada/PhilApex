import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Simple auth check for cron jobs if needed
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  
  // Date exactly 30 days from now
  const expiryTarget = new Date();
  expiryTarget.setDate(now.getDate() + 30);
  const targetDateString = expiryTarget.toISOString().split("T")[0];

  const notificationsToInsert: any[] = [];

  try {
    // 1. Check for Expiring Job Orders
    const { data: jobOrders, error: joError } = await (supabase as any)
      .from("job_orders")
      .select("id, job_order_number, valid_until, trade, program_name")
      .eq("valid_until", targetDateString);

    if (!joError && jobOrders) {
      for (const jo of jobOrders) {
        notificationsToInsert.push({
          notification_type: "job_order_expiry",
          entity_id: jo.id,
          title: `Job Order Expiring Soon`,
          message: `Job Order ${jo.job_order_number || jo.trade} is expiring on ${jo.valid_until}. Please review it and prepare for renewal.`,
        });
      }
    }

    // 2. Check for Expiring Accreditations
    const { data: accreditations, error: accError } = await (supabase as any)
      .from("accreditations")
      .select("id, accreditation_id_dmw, date_expiration, principal_partner_id, foreign_partners!principal_partner_id(name)")
      .eq("date_expiration", targetDateString);

    if (!accError && accreditations) {
      for (const acc of accreditations) {
        const partnerName = (acc.foreign_partners as any)?.name ?? "Unknown Partner";
        notificationsToInsert.push({
          notification_type: "accreditation_expiry",
          entity_id: acc.id,
          title: `Accreditation Expiring Soon`,
          message: `Accreditation ${acc.accreditation_id_dmw} for ${partnerName} is expiring on ${acc.date_expiration}.`,
        });
      }
    }

    // 3. Check for Pending Medical Expiring (If we tracked medical expiration)
    // For now we just implement the main ones.

    if (notificationsToInsert.length > 0) {
      // First, check if these notifications already exist so we don't spam them every time cron runs
      const { data: existingNotifs } = await (supabase as any)
        .from("notifications")
        .select("entity_id, notification_type")
        .in("entity_id", notificationsToInsert.map((n: any) => n.entity_id));
        
      const existingSet = new Set(existingNotifs?.map((n: any) => `${n.entity_id}-${n.notification_type}`) || []);
      
      const newNotifs = notificationsToInsert.filter((n: any) => !existingSet.has(`${n.entity_id}-${n.notification_type}`));

      if (newNotifs.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from("notifications")
          .insert(newNotifs);

        if (insertError) {
          console.error("Failed to insert notifications:", insertError);
          return NextResponse.json({ error: "Failed to insert notifications" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, count: notificationsToInsert.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
