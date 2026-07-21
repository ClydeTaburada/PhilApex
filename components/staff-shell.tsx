import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, ClipboardList, Send, Building2, FileCheck2, Factory, Search, MessageCircle } from "lucide-react";
import { StaffLogoutButton } from "@/components/staff-logout-button";

type Props = {
  active: "dashboard" | "messages" | "applicants" | "job-orders" | "applicant-detail" | "partners" | "accreditations" | "companies" | "deployments" | "team";
  staffName: string;
  staffRole: string;
  title: string;
  subtitle?: string;
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
  const roleLabel = ROLE_LABELS[staffRole] ?? staffRole;
  const initials = staffName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-[240px] shrink-0 fixed inset-y-0 left-0 z-20"
        style={{ background: "var(--navy)" }}
      >
        {/* Logo */}
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,.1)" }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Image
              src="/LOGO.jpg"
              alt="Phil-Apex logo"
              width={140}
              height={56}
              className="h-auto w-[110px]"
              priority
            />
          </Link>
          <p
            className="mt-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,.4)" }}
          >
            Staff Portal
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            if ((item as any).adminOnly && staffRole !== "admin") return null;
            if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-link ${active === item.key ? "active" : ""}`}
                id={`nav-${item.key}`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
          {active === "applicant-detail" && (
            <span className="sidebar-link active cursor-default">
              <span className="w-5 h-5 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </span>
              <span className="font-medium text-sm">Applicant Detail</span>
            </span>
          )}
        </nav>

        {/* Staff info + Logout */}
        <div
          className="px-3 py-4 border-t space-y-3"
          style={{ borderColor: "rgba(255,255,255,.1)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "rgba(255,255,255,.15)", color: "#fff" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{staffName}</p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,.5)" }}>
                {roleLabel}
              </p>
            </div>
          </div>
          <StaffLogoutButton />
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div
        className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center gap-3 px-4 h-14 border-b"
        style={{ background: "var(--navy)", borderColor: "rgba(255,255,255,.1)" }}
      >
        <Link href="/">
          <Image
            src="/LOGO.jpg"
            alt="Phil-Apex logo"
            width={90}
            height={36}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
          {NAV_ITEMS.map((item) => {
            if ((item as any).adminOnly && staffRole !== "admin") return null;
            if ((item as any).hideFromFrontDesk && staffRole === "front_desk") return null;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`sidebar-link text-xs px-2 py-1 ${active === item.key ? "active" : ""}`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <StaffLogoutButton />
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 lg:ml-[240px]">
        <main className="min-h-screen pt-20 lg:pt-8 px-4 md:px-6 py-6 max-w-[1200px] mx-auto">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold" style={{ color: "var(--navy)" }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm" style={{ color: "var(--ink-muted)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
