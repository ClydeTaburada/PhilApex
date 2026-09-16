'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Send, 
  Building2, 
  FileCheck2, 
  Factory, 
  MessageCircle, 
  Search,
  Menu,
  X
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { StaffLogoutButton } from "@/components/staff-logout-button";

type Props = {
  active: "dashboard" | "messages" | "applicants" | "job-orders" | "applicant-detail" | "partners" | "accreditations" | "companies" | "deployments" | "team";
  staffName: string;
  staffRole: string;
  title?: string;
  subtitle?: string;
  layoutMode?: "legacy" | "canonical";
  children: React.ReactNode;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  processing_officer: "Processing Officer",
  front_desk: "Front Desk",
};

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/staff/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "messages",
    label: "Messages",
    href: "/staff/messages",
    icon: MessageCircle,
  },
  {
    key: "applicants",
    label: "Applicants",
    href: "/staff/applicants",
    icon: Users,
  },
  {
    key: "job-orders",
    label: "Job Orders",
    href: "/staff/job-orders",
    icon: ClipboardList,
    hideFromFrontDesk: true,
  },
  {
    key: "deployments",
    label: "Deployments",
    href: "/staff/deployments",
    icon: Send,
    hideFromFrontDesk: true,
  },
  {
    key: "partners",
    label: "System Settings",
    href: "/staff/partners",
    icon: Building2,
    adminOnly: true,
  },
  {
    key: "team",
    label: "Team",
    href: "/staff/team",
    icon: Users,
    adminOnly: true,
  },
  {
    key: "accreditations",
    label: "Accreditations",
    href: "/staff/accreditations",
    icon: FileCheck2,
    hideFromFrontDesk: true,
  },
  {
    key: "companies",
    label: "Companies",
    href: "/staff/companies",
    icon: Factory,
    hideFromFrontDesk: true,
  },
];

export function StaffShell({
  active,
  staffName,
  staffRole,
  title,
  subtitle,
  children,
}: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const roleLabel = ROLE_LABELS[staffRole] ?? staffRole;
  const initials = staffName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentNav = NAV_ITEMS.find((item) => item.key === active);
  const displayTitle = title || currentNav?.label || "Overview Dashboard";

  return (
    <div className="h-full w-full flex overflow-hidden bg-background select-none">
      {/* ── Sidebar Desktop (Exact Accreditation System width & style) ── */}
      <aside className="hidden lg:flex flex-col w-[230px] shrink-0 h-full bg-white border-r border-gray-200 z-30">
        {/* Logo Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
              <Image
                src="/LOGO.jpg"
                alt="Phil-Apex logo"
                width={32}
                height={32}
                className="h-5 w-auto object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-gray-900 leading-tight truncate">Phil-Apex</h1>
              <p className="text-[10px] text-gray-500 leading-tight truncate">Placement Agency Inc.</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-2.5 space-y-1 overflow-y-auto min-h-0">
          {NAV_ITEMS.map((item) => {
            if ((item as any).adminOnly && staffRole !== "admin") return null;
            if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;

            const isActive = active === item.key;
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-gray-400"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
          {active === "applicant-detail" && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
              <Search className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">Applicant Detail</span>
            </div>
          )}
        </nav>

        {/* Bottom Logout */}
        <div className="px-2.5 py-2.5 border-t border-gray-200 flex-shrink-0">
          <StaffLogoutButton />
        </div>
      </aside>

      {/* ── Main Content Area with Fixed Topbar ───────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          pageTitle={displayTitle}
          userName={staffName}
          userRole={staffRole}
        />

        {/* Mobile Header Toggle */}
        <div className="lg:hidden shrink-0 h-10 bg-white border-b border-gray-200 px-3 flex items-center justify-between">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-xs font-bold text-gray-800 truncate">{displayTitle}</span>
          <div className="w-5" />
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden shrink-0 bg-white border-b border-gray-200 p-2 space-y-1 z-30">
            {NAV_ITEMS.map((item) => {
              if ((item as any).adminOnly && staffRole !== "admin") return null;
              if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;
              const isActive = active === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? "bg-primary/10 text-primary font-semibold" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-gray-100">
              <StaffLogoutButton />
            </div>
          </div>
        )}

        {/* Main Viewport Container (Zero Window Scrolling) */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 sm:p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
