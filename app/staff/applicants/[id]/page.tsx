import { notFound } from "next/navigation";
import { ApplicantDetailPanel } from "@/components/applicant-detail-panel";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { fetchApplicantDetail } from "@/lib/data/applicant-detail";
import { getAllJobOrders } from "@/lib/data/job-orders";

export const dynamic = "force-dynamic";

export default async function StaffApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireStaffContext();
  const { id } = await params;

  try {
    const { applicant, documents, deployment } = await fetchApplicantDetail(id);
    const jobOrders = await getAllJobOrders();

    return (
      <StaffShell
        active="applicant-detail"
        staffName={context.staff.full_name}
        staffRole={context.staff.role}
        title="Applicant Detail"
        subtitle={`${applicant.full_name} • ${applicant.id}`}
      >

        <ApplicantDetailPanel
          applicant={applicant}
          documents={documents}
          deployment={deployment}
          jobOrders={jobOrders}
          staffRole={context.staff.role}
        />
      </StaffShell>
    );
  } catch {
    notFound();
  }
}
