"use client";

import React, { useState } from "react";
import { Building2, Settings, FileText, Factory } from "lucide-react";
import { PartnersManager } from "@/components/partners-manager";
import { ProgramsManager } from "@/components/programs-manager";
import { TradesManager } from "@/components/trades-manager";
import { PartnerChain } from "@/components/partner-chain";
import { EmployerInvite } from "@/components/employer-invite";
import { buildPartnerChain } from "@/lib/data/partners";

type Props = {
  partners: any[];
  programs: any[];
  trades: any[];
  isAdmin: boolean;
};

export function SystemSettingsManager({ partners, programs, trades, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<"partners" | "programs" | "trades">("partners");

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
      {/* 1. Fixed Header (Shrink-0) */}
      <header className="shrink-0 flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">System Settings</h1>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Manage recruitment hierarchy and global configurations</p>
          </div>
        </div>
      </header>

      {/* 3. Split Pane Work Area */}
      <main className="flex-1 min-h-0 bg-white border border-gray-200 shadow-sm rounded-xl flex overflow-hidden">
        
        {/* Left Pane: Categories */}
        <div className="w-64 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/30">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            <button
              onClick={() => setActiveTab("partners")}
              className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                activeTab === "partners" 
                  ? "bg-white border-primary/50 shadow-md ring-2 ring-primary/20 text-primary scale-[1.02]" 
                  : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-sm">Foreign Partners</span>
            </button>
            <button
              onClick={() => setActiveTab("programs")}
              className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                activeTab === "programs" 
                  ? "bg-white border-primary/50 shadow-md ring-2 ring-primary/20 text-primary scale-[1.02]" 
                  : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-sm">Programs</span>
            </button>
            <button
              onClick={() => setActiveTab("trades")}
              className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                activeTab === "trades" 
                  ? "bg-white border-primary/50 shadow-md ring-2 ring-primary/20 text-primary scale-[1.02]" 
                  : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-200"
              }`}
            >
              <Factory className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-sm">Trades / Skills</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Settings Panel */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
            
            {activeTab === "partners" && (
              <>
                <div className="mb-4">
                  <PartnersManager partners={partners} programs={programs} />
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Partner Name</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-center">Final Employer?</th>
                        <th className="px-4 py-3">Program</th>
                        <th className="px-4 py-3">Chain</th>
                        <th className="px-4 py-3">Portal Access</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const topLevelPartners = partners.filter(p => !p.parent_partner_id);
                        if (partners.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
                              <tr className="bg-slate-50/50 hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-bold text-gray-900">{top.name}</td>
                                <td className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">{top.partner_type.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2.5 text-center">
                                  {top.is_final_employer ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Yes</span> : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">No</span>}
                                </td>
                                <td className="px-4 py-2.5">
                                  {top.program_name ? (
                                    <div className="flex flex-col leading-tight">
                                      <span className="font-semibold text-gray-800">{top.program_name}</span>
                                      <span className="text-[10px] text-gray-500">{top.program_country}</span>
                                    </div>
                                  ) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-4 py-2.5"><PartnerChain chain={topChain} /></td>
                                <td className="px-4 py-2.5">
                                  <EmployerInvite partnerId={top.id} partnerName={top.name} contactEmail={top.contact_email} accessCode={top.access_code} isAdmin={isAdmin} />
                                </td>
                              </tr>
                              {children.map(child => {
                                const childChain = buildPartnerChain(child.id, partners);
                                return (
                                  <tr key={child.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 pl-8">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-300">↳</span>
                                        <span className="font-semibold text-gray-700">{child.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{child.partner_type.replace(/_/g, " ")}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      {child.is_final_employer ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Yes</span> : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">No</span>}
                                    </td>
                                    <td className="px-4 py-2.5">
                                      {child.program_name ? (
                                        <div className="flex flex-col leading-tight">
                                          <span className="font-semibold text-gray-700">{child.program_name}</span>
                                          <span className="text-[10px] text-gray-500">{child.program_country}</span>
                                        </div>
                                      ) : <span className="text-gray-400">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5"><PartnerChain chain={childChain} /></td>
                                    <td className="px-4 py-2.5">
                                      <EmployerInvite partnerId={child.id} partnerName={child.name} contactEmail={child.contact_email} accessCode={child.access_code} isAdmin={isAdmin} />
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
              </>
            )}

            {activeTab === "programs" && (
              <div className="max-w-2xl">
                <ProgramsManager programs={programs} />
              </div>
            )}

            {activeTab === "trades" && (
              <div className="max-w-2xl">
                <TradesManager trades={trades} />
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
