import { notFound } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getAllPartners, buildPartnerChain } from "@/lib/data/partners";
import { getAllPrograms } from "@/lib/data/programs";
import { PartnerChain } from "@/components/partner-chain";
import { ProgramsManager } from "@/components/programs-manager";
import { PartnersManager } from "@/components/partners-manager";
import { TradesManager } from "@/components/trades-manager";
import { getAllTrades } from "@/lib/data/trades";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const [partners, programs, trades] = await Promise.all([
    getAllPartners(),
    getAllPrograms(),
    getAllTrades(),
  ]);

  return (
    <StaffShell
      active="partners"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      title="System Settings"
      subtitle="Manage global recruitment hierarchy, programs, and available trades"
    >
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <TradesManager trades={trades} />
        <ProgramsManager programs={programs} />
      </div>
      <div className="mb-8">
        <PartnersManager partners={partners} programs={programs} />
      </div>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner Name</th>
                <th>Type</th>
                <th>Final Employer?</th>
                <th>Program</th>
                <th>Chain / Parent</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const chain = buildPartnerChain(p.id, partners);
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td>
                      <span className="text-xs uppercase tracking-wide text-ink-muted">
                        {p.partner_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {p.is_final_employer ? (
                        <span className="badge badge-green">Yes</span>
                      ) : (
                        <span className="badge badge-gray">No</span>
                      )}
                    </td>
                    <td>
                      {p.program_name ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">{p.program_name}</span>
                          <span className="text-[10px] text-ink-faint">{p.program_country}</span>
                        </div>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td>
                      <PartnerChain chain={chain} />
                    </td>
                  </tr>
                );
              })}
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-ink-muted">
                    No foreign partners found.
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
