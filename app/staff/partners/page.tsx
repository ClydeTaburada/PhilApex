import React from "react";
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
import { EmployerInvite } from "@/components/employer-invite";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();
  const isAdmin = context.staff.role === "admin";

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
                <th>Portal Access</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const topLevelPartners = partners.filter(p => !p.parent_partner_id);
                
                if (partners.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-ink-muted">
                        No foreign partners found.
                      </td>
                    </tr>
                  );
                }

                return topLevelPartners.map(top => {
                  const children = partners.filter(p => p.parent_partner_id === top.id);
                  const topChain = buildPartnerChain(top.id, partners);
                  
                  return (
                    <React.Fragment key={top.id}>
                      <tr className="bg-slate-50/30">
                        <td>
                          <span className="font-bold text-navy">{top.name}</span>
                        </td>
                        <td>
                          <span className="text-xs uppercase tracking-wide font-semibold text-navy/70">
                            {top.partner_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          {top.is_final_employer ? (
                            <span className="badge badge-green">Yes</span>
                          ) : (
                            <span className="badge badge-gray">No</span>
                          )}
                        </td>
                        <td>
                          {top.program_name ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{top.program_name}</span>
                              <span className="text-[10px] text-ink-faint">{top.program_country}</span>
                            </div>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                        <td>
                          <PartnerChain chain={topChain} />
                        </td>
                        <td>
                          <EmployerInvite
                            partnerId={top.id}
                            partnerName={top.name}
                            contactEmail={top.contact_email}
                            accessCode={top.access_code}
                            isAdmin={isAdmin}
                          />
                        </td>
                      </tr>
                      {children.map(child => {
                        const childChain = buildPartnerChain(child.id, partners);
                        return (
                          <tr key={child.id}>
                            <td className="pl-10">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300">↳</span>
                                <span className="font-medium">{child.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="text-xs uppercase tracking-wide text-ink-muted">
                                {child.partner_type.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              {child.is_final_employer ? (
                                <span className="badge badge-green">Yes</span>
                              ) : (
                                <span className="badge badge-gray">No</span>
                              )}
                            </td>
                            <td>
                              {child.program_name ? (
                                <div className="flex flex-col">
                                  <span className="font-medium text-xs">{child.program_name}</span>
                                  <span className="text-[10px] text-ink-faint">{child.program_country}</span>
                                </div>
                              ) : (
                                <span className="text-ink-faint">—</span>
                              )}
                            </td>
                            <td>
                              <PartnerChain chain={childChain} />
                            </td>
                            <td>
                              <EmployerInvite
                                partnerId={child.id}
                                partnerName={child.name}
                                contactEmail={child.contact_email}
                                accessCode={child.access_code}
                                isAdmin={isAdmin}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </StaffShell>
  );
}
