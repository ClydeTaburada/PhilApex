import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, ClipboardList, Send, Building2, FileCheck2, Factory, Search, MessageCircle } from "lucide-react";
import { StaffLogoutButton } from "@/components/staff-logout-button";
import { StaffNotifications } from "@/components/staff-notifications";

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
  layoutMode = "legacy",
  children,
}: Props) {
  const roleLabel = ROLE_LABELS[staffRole] ?? staffRole;
  const initials = staffName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50/50 text-gray-900 font-sans">
      {/* ── Sidebar (Fixed & Compact) ───────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-slate-900 text-slate-300 border-r border-slate-800 z-20">
        {/* Logo Area */}
        <div className="shrink-0 h-14 flex items-center px-4 border-b border-slate-800 bg-slate-900/50">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex logo"
              width={100}
              height={40}
              className="h-8 w-auto object-contain brightness-0 invert"
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            if ((item as any).adminOnly && staffRole !== "admin") return null;
            if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;
            
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
          {active === "applicant-detail" && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white shadow-md shadow-primary/20">
              <Search className="w-4 h-4 text-white" />
              Applicant Detail
            </div>
          )}
        </nav>

        {/* User Profile Strip */}
        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-950/30 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{staffName}</p>
            <p className="text-[10px] text-slate-500 truncate">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StaffNotifications />
            <StaffLogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────────── */}
      <div className="lg:hidden shrink-0 fixed top-0 inset-x-0 z-20 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200">
        <Link href="/">
          <Image
            src="/LOGO.jpg"
            alt="Phil-Apex logo"
            width={90}
            height={36}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2">
          <StaffNotifications />
          <StaffLogoutButton />
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────── */}
      <main className={`flex-1 min-w-0 flex flex-col ${layoutMode === "legacy" ? "overflow-y-auto" : "min-h-0"}`}>
        {/* Mobile scroll nav spacer */}
        <div className="lg:hidden shrink-0 h-14" />
        <div className="lg:hidden shrink-0 overflow-x-auto border-b border-gray-200 bg-white">
          <nav className="flex items-center gap-1 px-2 py-2 whitespace-nowrap">
            {NAV_ITEMS.map((item) => {
              if ((item as any).adminOnly && staffRole !== "admin") return null;
              if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {layoutMode === "legacy" ? (
          <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
            {title && (
              <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
