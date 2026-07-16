import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getPartnerById } from "@/lib/data/partners";
import { getCompanyDetail } from "@/lib/data/companies";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const { id } = await params;
  const [partner, details] = await Promise.all([
    getPartnerById(id),
    getCompanyDetail(id),
  ]);

  if (!partner) return notFound();

  return (
    <StaffShell
      active="companies"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title={partner.name}
      subtitle="Deployment Detail"
    >
      <div className="mb-4 flex gap-4">
        <Link href="/staff/companies" className="btn btn-ghost">
          &larr; Back to Companies
        </Link>
        <a href={`/api/staff/companies/${id}/export`} className="btn btn-primary" download>
          Export CSV
        </a>
      </div>

      <div className="card rounded-xl overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Batch</th>
                <th>Job Order #</th>
                <th>Position</th>
                <th>Hired</th>
                <th>Status</th>
                <th>Entry</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr key={d.deployment_id}>
                  <td>
                    <span className="font-bold text-sm">{d.applicant_name}</span>
                  </td>
                  <td>
                    <span className="text-xs text-ink-muted">{d.batch_label}</span>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-ink-faint">{d.job_order_number ?? "—"}</span>
                  </td>
                  <td>
                    <span className="text-xs text-ink-muted">{d.position ?? "—"}</span>
                  </td>
                  <td>
                    <span className="text-xs">{d.hired_date}</span>
                  </td>
                  <td>
                    <span className={`badge ${d.document_status === "dispatched" ? "badge-green" : "badge-amber"}`}>
                      {d.document_status.replace("_", " ")}
                    </span>
                    {d.dispatched_date && <div className="text-[10px] mt-0.5 text-ink-faint">{d.dispatched_date}</div>}
                  </td>
                  <td>
                    <span className="text-xs">{d.entry_date ?? "—"}</span>
                  </td>
                  <td>
                    <span className="text-xs">{d.deployment_end_date ?? "—"}</span>
                  </td>
                </tr>
              ))}
              {details.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-ink-muted">
                    No deployments for this company yet.
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
