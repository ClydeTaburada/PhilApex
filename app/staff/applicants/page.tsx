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
      title="Applicant Dashboard"
      subtitle="Search, filter, and manage applicant pipeline records."
    >
      {/* ── Alerts Widget ──────────────────────────────── */}
      {contractAlerts.length > 0 && (
        <div className="card rounded-xl border-l-4 border-amber p-4 mb-5 bg-amber-50/30">
          <h3 className="font-bold text-amber-700 flex items-center gap-2 mb-3">
            <span>⚠️</span> Contract Ends Approaching (Next 90 Days)
          </h3>
          <ul className="flex flex-col gap-2">
            {contractAlerts.map((alert) => (
              <li key={alert.id} className="text-sm">
                <Link href={`/staff/applicants/${alert.applicant_id}`} className="font-medium text-ink hover:underline">
                  {alert.applicant_name}
                </Link>
                <span className="text-ink-muted"> (Batch: {alert.batch_id.slice(0,8)}...)</span>
                <span className="text-ink-muted"> — Deployed: {alert.entry_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Stats row ──────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3 mb-5">
        <div className="card p-4 flex items-center gap-3 rounded-xl">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "var(--navy-faint)", color: "var(--navy)" }}
          >
            👥
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
              Total Applicants
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--navy)" }}>
              {result.total}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 rounded-xl">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "#F0FDF4", color: "#16A34A" }}
          >
            📄
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
              Page
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
              {result.page} <span className="text-base font-normal" style={{ color: "var(--ink-faint)" }}>of {totalPages}</span>
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 rounded-xl">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
            style={{ background: "var(--amber-lt)", color: "var(--amber)" }}
          >
            📊
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
              Per Page
            </p>
            <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
              {result.pageSize}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <form
        action="/staff/dashboard"
        method="GET"
        className="card p-4 rounded-xl mb-4"
        id="dashboard-filter-form"
      >
        <p className="section-title mb-3">Filters</p>
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <input
            name="search"
            placeholder="Search full name…"
            defaultValue={normalized.search}
            className="form-input"
            id="filter-search"
          />

          <select
            name="pipeline_stage"
            defaultValue={normalized.pipeline_stage ?? ""}
            className="form-select"
            id="filter-pipeline"
          >
            <option value="">All pipeline stages</option>
            <option value="registered">Registered</option>
            <option value="documents_complete">Docs Complete</option>
            <option value="dmw_registered">DMW Registered</option>
            <option value="peos_certified">PEOS Certified</option>
            <option value="matched">Matched</option>
            <option value="deployed">Deployed</option>
          </select>

          <select
            name="occupation_applied"
            defaultValue={normalized.occupation_applied ?? ""}
            className="form-select"
            id="filter-trade"
          >
            <option value="">All trades</option>
            {Array.from(uniqueTrades).map((trade) => (
              <option key={trade as string} value={trade as string}>
                {trade as string}
              </option>
            ))}
          </select>

          <select
            name="source"
            defaultValue={normalized.source ?? ""}
            className="form-select"
            id="filter-source"
          >
            <option value="">All sources</option>
            <option value="walk_in">Walk-in</option>
            <option value="job_fair">Job Fair</option>
            <option value="lgu_peso">LGU/PESO</option>
          </select>

          <select
            name="gender"
            defaultValue={normalized.gender ?? ""}
            className="form-select"
            id="filter-gender"
          >
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            name="missing_document"
            defaultValue={normalized.missing_document ?? ""}
            className="form-select"
            id="filter-doc"
          >
            <option value="">Any document state</option>
            {docOptions.map((doc) => (
              <option key={doc.id} value={doc.doc_name}>
                Missing: {doc.doc_name}
              </option>
            ))}
          </select>

          <div className="form-field">
            <label className="form-label">Date from</label>
            <input
              type="date"
              name="date_from"
              defaultValue={normalized.date_from}
              className="form-input"
              id="filter-date-from"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Date to</label>
            <input
              type="date"
              name="date_to"
              defaultValue={normalized.date_to}
              className="form-input"
              id="filter-date-to"
            />
          </div>

          <select
            name="has_passport"
            defaultValue={normalized.has_passport ?? ""}
            className="form-select"
            id="filter-passport"
          >
            <option value="">Passport (any)</option>
            <option value="true">Has passport</option>
            <option value="false">No passport</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            id="filter-apply"
            type="submit"
            className="btn btn-primary"
          >
            Apply Filters
          </button>
          <Link
            href={`/api/staff/dashboard/export?${exportQuery.toString()}`}
            id="filter-export"
            className="btn btn-ghost"
          >
            ↓ Export CSV
          </Link>
          <Link href="/staff/dashboard" id="filter-clear" className="btn btn-ghost">
            Clear
          </Link>
        </div>
      </form>

      {/* ── Table ──────────────────────────────────────── */}
      <div className="card rounded-xl overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Name</th>
                <th>Trade</th>
                <th>Source</th>
                <th>Pipeline</th>
                <th>Passport</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/staff/applicants/${row.id}`}
                      className="font-mono text-xs font-semibold"
                      style={{ color: "var(--navy)", textDecoration: "none" }}
                      id={`applicant-row-${row.id.slice(0, 8)}`}
                    >
                      {row.reference_number || (
                        <>
                          {row.id.slice(0, 8)}
                          <span style={{ color: "var(--ink-faint)" }}>…</span>
                        </>
                      )}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/staff/applicants/${row.id}`}
                      className="font-semibold hover:underline"
                      style={{ color: "var(--ink)", textDecoration: "none" }}
                    >
                      {row.full_name}
                    </Link>
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>
                    {row.occupation_applied ?? <span style={{ color: "var(--ink-faint)" }}>N/A</span>}
                  </td>
                  <td style={{ color: "var(--ink-muted)" }}>
                    {SOURCE_LABELS[row.source] ?? row.source}
                  </td>
                  <td>
                    <PipelineBadge stage={row.current_pipeline_stage} />
                  </td>
                  <td>
                    {row.has_passport ? (
                      <span className="badge badge-green">Yes</span>
                    ) : (
                      <span className="badge badge-gray">No</span>
                    )}
                  </td>
                  <td style={{ color: "var(--ink-muted)", fontSize: ".8125rem" }}>
                    {new Date(row.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {result.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    <div className="text-3xl mb-2">🔍</div>
                    No applicants match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────── */}
      <div className="flex items-center justify-between text-sm" style={{ color: "var(--ink-muted)" }}>
        <span>
          Page{" "}
          <strong style={{ color: "var(--ink)" }}>{result.page}</strong> of{" "}
          <strong style={{ color: "var(--ink)" }}>{totalPages}</strong>
          {" "}—{" "}
          <strong style={{ color: "var(--ink)" }}>{result.total}</strong> total records
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={`/staff/dashboard?${new URLSearchParams({
                ...normalized,
                page: String(result.page - 1),
              }).toString()}`}
              id="pagination-prev"
              className="btn btn-ghost btn-sm"
            >
              ← Previous
            </Link>
          ) : null}
          {result.page < totalPages ? (
            <Link
              href={`/staff/dashboard?${new URLSearchParams({
                ...normalized,
                page: String(result.page + 1),
              }).toString()}`}
              id="pagination-next"
              className="btn btn-ghost btn-sm"
            >
              Next →
            </Link>
          ) : null}
        </div>
      </div>
    </StaffShell>
  );
}
