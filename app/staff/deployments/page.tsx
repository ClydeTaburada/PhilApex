import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getDeploymentMonitoringRows } from "@/lib/data/deployments";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DeploymentMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const rows = await getDeploymentMonitoringRows(q || undefined);

  return (
    <StaffShell
      active="job-orders"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Deployment Monitoring"
      subtitle="Search deployments across batches and companies"
    >
      <div className="card rounded-xl p-4 mb-4">
        <form method="GET" className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="form-label">Search applicant</label>
            <input name="q" defaultValue={q} className="form-input" placeholder="Applicant name" />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
          <a href="/api/staff/deployments/export" className="btn btn-ghost">Export CSV</a>
        </form>
      </div>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Batch</th>
                <th>Job Order</th>
                <th>Position</th>
                <th>Company</th>
                <th>Program / Country</th>
                <th>Status</th>
                <th>Hired</th>
                <th>Entry</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/staff/applicants/${row.applicant_id}`} className="font-semibold hover:underline">
                      {row.applicant_name ?? "—"}
                    </Link>
                  </td>
                  <td>{row.batch_label ?? "—"}</td>
                  <td>{row.job_order_number ?? "—"}</td>
                  <td>{row.position ?? "—"}</td>
                  <td>{row.foreign_partner_name ?? "—"}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{row.program_name ?? "—"}</span>
                      <span className="text-[10px] text-ink-faint">{row.country ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${row.document_status === "dispatched" ? "badge-green" : "badge-amber"}`}>
                      {row.document_status === "dispatched" ? "Dispatched" : "On Process"}
                    </span>
                  </td>
                  <td>{row.hired_date}</td>
                  <td>{row.entry_date ?? "—"}</td>
                  <td>{row.deployment_end_date ?? "Active"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center p-8 text-ink-muted">
                    No deployment rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StaffShell>
  );
}
