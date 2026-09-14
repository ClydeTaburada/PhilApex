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

import { SystemSettingsManager } from "@/components/system-settings-manager";

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
      layoutMode="canonical"
    >
      <SystemSettingsManager 
        partners={partners}
        programs={programs}
        trades={trades}
        isAdmin={isAdmin}
      />
    </StaffShell>
  );
}
