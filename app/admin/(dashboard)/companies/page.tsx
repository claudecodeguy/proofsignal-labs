export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, statusBadgeClass } from "@/lib/utils";
import NewRunModal from "../components/NewRunModal";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ runId?: string }> }) {
  const { runId } = await searchParams;
  const whereClause = runId ? { discoveryRunId: runId } : {};

  const [companies, total, activeVertical] = await Promise.all([
    db.companyRaw.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        companyName: true,
        domain: true,
        city: true,
        state: true,
        validationStatus: true,
        confidenceScore: true,
        discoverySource: true,
        createdAt: true,
        locationCountEstimate: true,
      },
    }).catch(() => []),
    db.companyRaw.count({ where: whereClause }).catch(() => 0),
    db.vertical.findFirst({ where: { key: "dental_msp_us" } }).catch(() => null),
  ]);

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {total} records shown{runId ? ` · filtered by run ${runId.slice(-8)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-xs">Import CSV</button>
          <button className="btn-ghost text-xs">Add Manually</button>
          <NewRunModal verticalId={activeVertical?.id ?? ""} />
        </div>
      </div>

      {/* Run filter banner */}
      {runId && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-teal/5 border border-teal/20 rounded-lg">
          <span className="font-mono text-xs text-teal">Showing companies from run <span className="font-semibold">{runId.slice(-12)}</span></span>
          <Link href="/admin/companies" className="font-mono text-xs text-ink-muted hover:text-ink transition-colors ml-auto">Clear filter ×</Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search companies…"
            className="form-input pl-8 w-56 py-2 text-xs"
          />
        </div>

        <select className="form-select w-36 py-2 text-xs">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="borderline">Borderline</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </select>

        <select className="form-select w-36 py-2 text-xs">
          <option value="">All regions</option>
          <option value="TX">Texas</option>
          <option value="AZ">Arizona</option>
          <option value="FL">Florida</option>
          <option value="CA">California</option>
        </select>

        <select className="form-select w-40 py-2 text-xs">
          <option value="">All sources</option>
          <option value="directory">Directory</option>
          <option value="search">Search</option>
          <option value="csv_import">CSV Import</option>
          <option value="manual">Manual Entry</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-xs text-ink-faint">{total} results</span>
          <button className="btn-ghost text-xs px-3 py-1.5">Export CSV</button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {companies.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Domain</th>
                <th>Geography</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Locations</th>
                <th>Source</th>
                <th>Discovered</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="font-medium text-ink hover:text-teal transition-colors"
                    >
                      {company.companyName}
                    </Link>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-muted">{company.domain}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-muted">
                      {[company.city, company.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={statusBadgeClass(company.validationStatus)}>
                      {company.validationStatus}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${company.confidenceScore}%`,
                            backgroundColor:
                              company.confidenceScore >= 90
                                ? "#1A6B45"
                                : company.confidenceScore >= 75
                                ? "#B07A10"
                                : "#8B1E2F",
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-ink shrink-0">
                        {company.confidenceScore}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-muted">
                      {company.locationCountEstimate ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span className="badge-neutral capitalize">
                      {company.discoverySource.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-faint">
                      {formatDate(company.createdAt.toISOString())}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-xs text-ink-faint">No companies yet.</p>
            <p className="text-sm text-ink-muted mt-1">
              Start a discovery run to populate this list.
            </p>
          </div>
        )}
      </div>

      {total > 100 && (
        <div className="flex items-center justify-between mt-4">
          <span className="font-mono text-xs text-ink-faint">
            Showing 1–{Math.min(100, total)} of {total}
          </span>
        </div>
      )}
    </div>
  );
}
