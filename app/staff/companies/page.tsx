import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getCompanyList } from "@/lib/data/companies";
import { ExpiryBadge } from "@/components/expiry-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const companies = await getCompanyList();

  return (
    <StaffShell
      active="companies"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="Companies Overview"
      subtitle="Final employers, deployments, and balances"
    >
      <div className="card rounded-xl overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Program / Country</th>
                <th>Principal / Parent</th>
                <th>Accreditation</th>
                <th>Slots Req.</th>
                <th>Deployed</th>
                <th>Active</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/staff/companies/${c.id}`} className="font-bold text-primary hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{c.program_name ?? "—"}</span>
                      <span className="text-[10px] text-ink-faint">{c.country ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-ink-muted">{c.parent_name ?? "Direct"}</span>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className="text-[10px] uppercase">{c.accreditation_status ?? "None"}</span>
                      {c.accreditation_expiry_tier && <ExpiryBadge tier={c.accreditation_expiry_tier} />}
                    </div>
                  </td>
                  <td className="text-center font-medium">{c.slots_requested}</td>
                  <td className="text-center">{c.total_hired}</td>
                  <td className="text-center text-primary font-medium">{c.active_hired}</td>
                  <td className="text-center font-bold text-ink">{c.balance}</td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-ink-muted">
                    No companies found.
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
