import { notFound } from "next/navigation";
import Link from "next/link";
import { Factory, Search, Globe2, Building2 } from "lucide-react";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { getCompanyList } from "@/lib/data/companies";
import { getAllPrograms } from "@/lib/data/programs";
import { ExpiryBadge } from "@/components/expiry-badge";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const context = await requireStaffContext();
  if (context.staff.role === "front_desk") return notFound();

  const sp = await searchParams;
  const programFilter = typeof sp?.program === "string" && sp.program.trim() !== "" ? sp.program.trim() : undefined;
  const countryFilter = typeof sp?.country === "string" && sp.country.trim() !== "" ? sp.country.trim() : undefined;
  const search = typeof sp?.search === "string" && sp.search.trim() !== "" ? sp.search.trim().toLowerCase() : undefined;

  const [allCompanies, programs] = await Promise.all([
    getCompanyList(),
    getAllPrograms(),
  ]);

  let companies = allCompanies;
  if (programFilter) {
    companies = companies.filter((c) => c.program_name === programFilter);
  }
  if (countryFilter) {
    companies = companies.filter((c) => c.country === countryFilter);
  }
  if (search) {
    companies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.program_name && c.program_name.toLowerCase().includes(search)) ||
        (c.country && c.country.toLowerCase().includes(search)) ||
        (c.parent_name && c.parent_name.toLowerCase().includes(search))
    );
  }

  return (
    <StaffShell
      active="companies"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      layoutMode="canonical"
    >
      <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
        {/* 1. Fixed Header (Shrink-0) */}
        <header className="shrink-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Companies Overview</h1>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Final employers, deployments, accreditations, and balances</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500">
            <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-semibold text-gray-700">
              {companies.length} of {allCompanies.length} Companies
            </span>
          </div>
        </header>

        {/* 2. Fixed Filter Bar (Shrink-0) */}
        <form
          action="/staff/companies"
          method="GET"
          className="shrink-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
        >
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              placeholder="Search company or parent…"
              defaultValue={sp?.search?.toString() ?? ""}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            name="program"
            defaultValue={programFilter ?? ""}
            className="text-xs rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Programs ({programs.length})</option>
            {programs.map((prog) => (
              <option key={prog.id} value={prog.name}>
                {prog.name} ({prog.country})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors shadow-xs"
          >
            Filter
          </button>

          {(programFilter || countryFilter || search) && (
            <Link
              href="/staff/companies"
              className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1.5 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* 3. Table Work Area (Flex-1 Min-H-0 Overflow-Hidden) */}
        <main className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-xs">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Program / Country</th>
                  <th className="px-4 py-3">Principal / Parent</th>
                  <th className="px-4 py-3">Accreditation</th>
                  <th className="px-4 py-3 text-center">Slots Req.</th>
                  <th className="px-4 py-3 text-center">Deployed</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-center">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-gray-900">
                      <Link href={`/staff/companies/${c.id}`} className="text-primary hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col leading-tight">
                        <span className="font-semibold text-gray-800">{c.program_name ?? "—"}</span>
                        <span className="text-[10px] text-gray-400">{c.country ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {c.parent_name ? (
                        <span className="font-medium text-gray-700">{c.parent_name}</span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Direct</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                          {c.accreditation_status ?? "None"}
                        </span>
                        {c.accreditation_expiry_tier && <ExpiryBadge tier={c.accreditation_expiry_tier} />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-gray-800">{c.slots_requested}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{c.total_hired}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-primary">{c.active_hired}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-gray-900">{c.balance}</td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-12 text-gray-400 text-xs">
                      No companies match your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </StaffShell>
  );
}
