import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getAllAccreditations } from "@/lib/data/accreditations";
import { getAllPartners } from "@/lib/data/partners";
import { AccreditationsManager } from "@/components/accreditations-manager";

export const dynamic = "force-dynamic";

export default async function AccreditationsPage() {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const [accreditations, partners] = await Promise.all([
    getAllAccreditations(),
    getAllPartners(),
  ]);

  return (
    <StaffShell
      active="accreditations"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Accreditations"
      subtitle="Track DMW accreditation validities"
    >
      <AccreditationsManager initialRows={accreditations} partners={partners} />
    </StaffShell>
  );
}
