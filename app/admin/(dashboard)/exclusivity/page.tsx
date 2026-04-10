import type { Metadata } from "next";
import { EXCLUSIVITY_LOCKS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Exclusivity" };

export default function ExclusivityPage() {
  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exclusivity</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {EXCLUSIVITY_LOCKS.length} active locks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-xs">Check Conflict</button>
          <button className="btn-primary text-xs px-4 py-2">+ Create Lock</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Locks", value: "18", color: "#1E7B7E" },
          { label: "Territory: TX", value: "12" },
          { label: "Territory: AZ", value: "6" },
          { label: "Expiring in 30d", value: "0" },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-stat-card">
            <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-2">{label}</p>
            <p className="font-mono text-2xl font-semibold" style={color ? { color } : { color: "#18182B" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="rounded border border-teal/20 bg-teal-pale px-5 py-4 mb-6 flex items-start gap-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-teal shrink-0 mt-0.5">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 5V8.5M8 11V11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-ink-muted">
          Active locks prevent the same lead from being exported or attached to outreach for a competing buyer in the same territory during the lock window.
          Default window: <strong className="text-ink">180 days</strong>. Locks can be expired manually by the operator.
        </p>
      </div>

      {/* Lock table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border bg-canvas-subtle">
          <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider">Active Exclusivity Locks</p>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Lead / Company</th>
              <th>Locked By</th>
              <th>Territory</th>
              <th>Niche</th>
              <th>Days Remaining</th>
              <th>Locked</th>
              <th>Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {EXCLUSIVITY_LOCKS.map((lock) => (
              <tr key={lock.id}>
                <td>
                  <p className="font-medium text-sm text-ink">{lock.companyName}</p>
                  <p className="font-mono text-2xs text-ink-faint">{lock.leadId}</p>
                </td>
                <td>
                  <p className="text-sm text-ink">{lock.buyerCompany}</p>
                </td>
                <td>
                  <span className="badge-neutral font-mono">{lock.territory}</span>
                </td>
                <td>
                  <span className="badge-teal">{lock.niche}</span>
                </td>
                <td>
                  <span className="font-mono text-sm font-semibold text-approved">
                    {lock.daysRemaining}d
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs text-ink-faint">{formatDate(lock.lockedAt)}</span>
                </td>
                <td>
                  <span className="font-mono text-xs text-ink-faint">{formatDate(lock.expiresAt)}</span>
                </td>
                <td>
                  <button className="text-xs font-medium text-rejected hover:text-rejected/80 transition-colors">
                    Expire Lock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conflict checker */}
      <div className="card p-5 max-w-lg">
        <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Conflict Checker</h3>
        <p className="text-sm text-ink-muted mb-4">
          Check whether a lead or territory has an active lock before attaching to outreach.
        </p>
        <div className="space-y-3">
          <div>
            <label className="form-label text-xs">Lead ID or Domain</label>
            <input type="text" placeholder="e.g. brightsmilesdentistry.com" className="form-input text-xs py-2" />
          </div>
          <div>
            <label className="form-label text-xs">Buyer Territory</label>
            <select className="form-select text-xs py-2">
              <option>TX</option>
              <option>AZ</option>
            </select>
          </div>
          <button className="btn-secondary w-full justify-center text-xs">Check for Conflicts</button>
        </div>
      </div>
    </div>
  );
}
