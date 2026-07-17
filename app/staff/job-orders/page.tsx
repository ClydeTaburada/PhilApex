import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getAllJobOrdersV2, getBatchesByJobOrder, getDeploymentsByBatch } from "@/lib/data/batches";
import { JobOrderOverviewTable } from "@/components/job-order-overview-table";

export const dynamic = "force-dynamic";

export default async function JobOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const sp = await searchParams;
  const statusFilter = typeof sp?.status === 'string' ? sp.status : undefined;

  let jobOrders = await getAllJobOrdersV2();
  if (statusFilter) {
    jobOrders = jobOrders.filter(jo => jo.status === statusFilter);
  }

  const jobOrderDetails = await Promise.all(
    jobOrders.map(async (jobOrder) => {
      const [batches, deploymentsByBatch] = await Promise.all([
        getBatchesByJobOrder(jobOrder.id),
        Promise.all(
          (await getBatchesByJobOrder(jobOrder.id)).map(async (batch) => ({
            batchId: batch.id,
            deployments: await getDeploymentsByBatch(batch.id),
          })),
        ),
      ]);

      return {
        jobOrder,
        batches,
        deploymentsByBatch: Object.fromEntries(
          (await Promise.all(
            batches.map(async (batch) => [batch.id, await getDeploymentsByBatch(batch.id)]),
          )) as Array<[string, Awaited<ReturnType<typeof getDeploymentsByBatch>>]>
        ),
      };
    }),
  );

  return (
    <StaffShell
      active="job-orders"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Job Orders (Phase 2)"
      subtitle="View job orders, slots, and validity."
    >
      <div className="card rounded-xl p-5 mb-6">
        <p className="text-sm text-ink-muted">
          Job Orders are now associated with Accreditations and support batch/deployment workflows.
        </p>
      </div>

      <div className="mt-4">
        <JobOrderOverviewTable
          jobOrderDetails={jobOrderDetails}
          staffRole={context.staff.role}
        />
      </div>
    </StaffShell>
  );
}
