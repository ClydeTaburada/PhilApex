import Link from "next/link";
import { StaffShell } from "@/components/staff-shell";
import { requireStaffContext } from "@/lib/auth";
import { fetchApplicantsPage } from "@/lib/data/applicants";
import { dashboardFilterSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getContractEndAlerts } from "@/lib/data/batches";

export const dynamic = "force-dynamic";

function normalizeSearchParams(
  raw: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "") {
      output[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.length > 0 && value[0]?.trim() !== "") {
      output[key] = value[0] ?? "";
    }
  }
  return output;
}

type PipelineStage =
  | "registered"
  | "documents_complete"
  | "dmw_registered"
  | "peos_certified"
  | "matched"
  | "deployed";

const PIPELINE_CONFIG: Record<
  PipelineStage,
  { label: string; badgeClass: string }
> = {
  registered:         { label: "Registered",          badgeClass: "badge badge-navy"   },
  documents_complete: { label: "Docs Complete",        badgeClass: "badge badge-purple" },
  dmw_registered:     { label: "DMW Registered",       badgeClass: "badge badge-amber"  },
  peos_certified:     { label: "PEOS Certified",       badgeClass: "badge badge-orange" },
  matched:            { label: "Matched",              badgeClass: "badge badge-teal"   },
  deployed:           { label: "Deployed",             badgeClass: "badge badge-green"  },
};

const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in",
  job_fair: "Job Fair",
  lgu_peso: "LGU/PESO",
};

function PipelineBadge({ stage }: { stage: string }) {
  const config = PIPELINE_CONFIG[stage as PipelineStage];
  if (!config) {
    return <span className="badge badge-gray">{stage}</span>;
  }
  return <span className={config.badgeClass}>{config.label}</span>;
}

export default async function StaffDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabaseAdmin = getSupabaseAdminClient();
  const context = await requireStaffContext();
  const normalized = normalizeSearchParams(await searchParams);
  const parsedFilters = dashboardFilterSchema.safeParse(normalized);

  const filters = parsedFilters.success
    ? parsedFilters.data
    : dashboardFilterSchema.parse({ page: 1 });
  const result = await fetchApplicantsPage(filters);

  const { data: docs } = await supabaseAdmin
    .from("document_requirements")
    .select("id, doc_name")
    .order("doc_name", { ascending: true });

  const docOptions = (docs ?? []) as Array<{ id: number; doc_name: string }>;
  const uniqueTrades = new Set(result.rows.map((row) => row.occupation_applied).filter(Boolean));
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const contractAlerts = await getContractEndAlerts();

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(normalized)) {
    if (value) exportQuery.set(key, value);
  }

  return (
    <StaffShell
      active="applicants"
      staffName={context.staff.full_name}
      staffRole={context.staff.role}
      layoutMode="canonical"
    >
      <div className="h-full flex flex-col min-h-0 overflow-hidden space-y-2.5">
        {/* 1. Fixed Header */}
        <header className="shrink-0 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="text-sm font-bold">👥</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Applicants</h1>
              <p className="text-[11px] text-gray-500 leading-tight">Search and filter applicant pipeline records</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
             <span>Page {result.page} of {totalPages}</span>
             <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{result.total} total</span>
          </div>
        </header>

        {/* 2. Fixed Filter Bar */}
        <form
          action="/staff/applicants"
          method="GET"
          className="shrink-0 flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
          id="dashboard-filter-form"
        >
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              name="search"
              placeholder="Search full name…"
              defaultValue={normalized.search}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <select name="pipeline_stage" defaultValue={normalized.pipeline_stage ?? ""} className="text-xs rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
            <option value="">All stages</option>
            <option value="registered">Registered</option>
            <option value="documents_complete">Docs Complete</option>
            <option value="dmw_registered">DMW Registered</option>
            <option value="peos_certified">PEOS Certified</option>
            <option value="matched">Matched</option>
            <option value="deployed">Deployed</option>
          </select>

          <select name="occupation_applied" defaultValue={normalized.occupation_applied ?? ""} className="text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
            <option value="">All trades</option>
            {Array.from(uniqueTrades).map((trade) => (
              <option key={trade as string} value={trade as string}>{trade as string}</option>
            ))}
          </select>

          <select name="source" defaultValue={normalized.source ?? ""} className="text-xs rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
            <option value="">All sources</option>
            <option value="walk_in">Walk-in</option>
            <option value="job_fair">Job Fair</option>
            <option value="lgu_peso">LGU/PESO</option>
          </select>

          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <button type="submit" className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
              Apply
            </button>
            <Link href="/staff/applicants" className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
              Clear
            </Link>
            <Link href={`/api/staff/dashboard/export?${exportQuery.toString()}`} className="text-xs font-medium bg-slate-100 text-slate-900 border border-transparent hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
              Export
            </Link>
          </div>
        </form>

        {/* 3. Scrollable Work Area */}
        <main className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 z-10 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ref ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Pipeline</th>
                  <th className="px-4 py-3 text-center">Passport</th>
                  <th className="px-4 py-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/staff/applicants/${row.id}`} className="font-mono text-[11px] font-semibold text-primary hover:underline bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                        {row.reference_number || `${row.id.slice(0, 8)}…`}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/staff/applicants/${row.id}`} className="font-semibold text-gray-900 hover:underline">
                        {row.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {row.occupation_applied ?? <span className="text-gray-400">N/A</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <PipelineBadge stage={row.current_pipeline_stage} />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.has_passport ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Yes</span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[10px] text-gray-500">
                      {new Date(row.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
                {result.rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                       <span className="text-2xl mb-2 block">🔍</span>
                       <p className="text-sm font-semibold text-gray-700">No applicants found</p>
                       <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Try adjusting your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Info Strip */}
          <footer className="shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-2 text-[11px] text-gray-500 flex justify-between items-center">
            <span>Showing {result.rows.length} items</span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link href={`/staff/applicants?${new URLSearchParams({ ...normalized, page: String(result.page - 1) }).toString()}`} className="hover:text-gray-900 hover:underline">
                  ← Previous
                </Link>
              )}
              {result.page < totalPages && (
                <Link href={`/staff/applicants?${new URLSearchParams({ ...normalized, page: String(result.page + 1) }).toString()}`} className="hover:text-gray-900 hover:underline">
                  Next →
                </Link>
              )}
            </div>
          </footer>
        </main>
      </div>
    </StaffShell>
  );
}
