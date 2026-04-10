import type { Metadata } from "next";
import { SETTINGS_CONFIG } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-5 pb-4 border-b border-border">
        {title}
      </h2>
      {children}
    </div>
  );
}

function FieldRow({ label, value, type = "text", redacted }: { label: string; value: string; type?: string; redacted?: boolean }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 items-start py-3 border-b border-border/60 last:border-0">
      <label className="font-mono text-xs text-ink-faint pt-2.5 uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type={type}
          defaultValue={value}
          readOnly={redacted}
          className={`form-input text-xs py-2 font-mono flex-1 ${redacted ? "bg-canvas-subtle" : ""}`}
        />
        {redacted && (
          <button className="btn-ghost text-xs px-3 py-1.5 shrink-0">Reveal</button>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, unit }: { label: string; value: number; min?: number; max?: number; unit?: string }) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 items-center py-3 border-b border-border/60 last:border-0">
      <label className="font-mono text-xs text-ink-faint uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          defaultValue={value}
          min={min}
          max={max}
          className="form-input text-xs py-2 font-mono w-28"
        />
        {unit && <span className="font-mono text-xs text-ink-faint">{unit}</span>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const s = SETTINGS_CONFIG;

  return (
    <div className="p-8">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <button className="btn-primary text-xs px-4 py-2">Save Changes</button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Vertical Pack */}
        <Section title="Active Vertical Pack">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-sm text-ink">dental_msp_us</p>
              <p className="text-xs text-ink-muted mt-0.5">Dental Clinic Leads → Dental-Focused MSPs / MSSPs · United States</p>
            </div>
            <span className="badge-approved">Active</span>
          </div>
          <div className="rounded border border-border bg-canvas-subtle px-4 py-3">
            <p className="font-mono text-xs text-ink-faint">
              Phase 1 supports one active vertical pack. Additional packs can be added without schema changes.
            </p>
          </div>
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          <FieldRow label="Firecrawl API Key" value={s.apiKeys.firecrawl} redacted />
          <FieldRow label="Anthropic API Key" value={s.apiKeys.anthropic} redacted />
          <FieldRow label="Hunter.io API Key" value={s.apiKeys.hunter} redacted />
        </Section>

        {/* Scoring Thresholds */}
        <Section title="Scoring Thresholds">
          <div className="mb-4 p-4 rounded bg-canvas-subtle border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Auto-Approve", range: `≥ ${s.scoringThresholds.approveAbove}`, color: "#1A6B45" },
                { label: "Borderline", range: `${s.scoringThresholds.borderlineAbove}–${s.scoringThresholds.approveAbove - 1}`, color: "#B07A10" },
                { label: "Auto-Reject", range: `< ${s.scoringThresholds.rejectBelow}`, color: "#8B1E2F" },
              ].map(({ label, range, color }) => (
                <div key={label}>
                  <p className="font-mono text-lg font-semibold" style={{ color }}>{range}</p>
                  <p className="font-mono text-2xs text-ink-faint mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <NumberField label="Approve above" value={s.scoringThresholds.approveAbove} min={80} max={100} unit="/ 100" />
          <NumberField label="Borderline above" value={s.scoringThresholds.borderlineAbove} min={60} max={95} unit="/ 100" />
        </Section>

        {/* Per-run budgets */}
        <Section title="Per-Run Usage Budgets">
          <NumberField label="Max companies / run" value={s.perRunBudgets.maxCompanies} unit="companies" />
          <NumberField label="Max buyers / run" value={s.perRunBudgets.maxBuyers} unit="buyers" />
          <NumberField label="Max pages / run" value={s.perRunBudgets.maxPagesPerRun} unit="pages" />
          <NumberField label="Max Haiku calls / run" value={s.perRunBudgets.maxHaikuCalls} unit="calls" />
          <NumberField label="Max Sonnet calls / run" value={s.perRunBudgets.maxSonnetCalls} unit="calls" />
          <div className="grid grid-cols-[200px_1fr] gap-4 items-center py-3">
            <span className="font-mono text-xs text-ink-faint uppercase tracking-wider">Sonnet Fallback</span>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-9 h-5 rounded-full transition-colors ${s.perRunBudgets.sonnetFallbackEnabled ? "bg-teal" : "bg-border"} relative`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.perRunBudgets.sonnetFallbackEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-ink-muted">
                {s.perRunBudgets.sonnetFallbackEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </Section>

        {/* Exclusivity */}
        <Section title="Exclusivity Defaults">
          <NumberField label="Default lock window" value={s.exclusivity.defaultWindowDays} unit="days" />
          <div className="grid grid-cols-[200px_1fr] gap-4 items-center py-3">
            <span className="font-mono text-xs text-ink-faint uppercase tracking-wider">Lock by territory</span>
            <select className="form-select text-xs py-2 w-40">
              <option value="state">State</option>
              <option value="metro">Metro area</option>
              <option value="city">City</option>
            </select>
          </div>
        </Section>

        {/* Sender / outbound */}
        <Section title="Sender Identity">
          <FieldRow label="Sender Email" value="outreach@proofsignallabs.com" />
          <FieldRow label="Sender Name" value="ProofSignal Labs" />
          <FieldRow label="Postal Address" value="123 Main St, Austin, TX 78701" />
        </Section>

        {/* Deliverability checklist */}
        <Section title="Deliverability Checklist">
          <div className="space-y-3">
            {[
              { label: "Sending Domain", status: true, value: "proofsignallabs.com" },
              { label: "SPF Record", status: s.deliverability.spfConfigured, value: "Configured" },
              { label: "DKIM Record", status: s.deliverability.dkimConfigured, value: "Configured" },
              { label: "DMARC Record", status: s.deliverability.dmarcConfigured, value: "Not configured" },
              { label: "Sending Inbox", status: true, value: s.deliverability.inboxAssigned },
              { label: "Inbox Warmup", status: false, value: "Not tracked — configure externally" },
            ].map(({ label, status, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status ? "bg-approved" : "bg-borderline"}`} />
                  <span className="text-sm font-medium text-ink">{label}</span>
                </div>
                <span className="font-mono text-xs text-ink-muted">{value}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-2xs text-ink-faint mt-4">
            Inbox warmup and advanced DNS management must be configured externally.
          </p>
        </Section>
      </div>
    </div>
  );
}
