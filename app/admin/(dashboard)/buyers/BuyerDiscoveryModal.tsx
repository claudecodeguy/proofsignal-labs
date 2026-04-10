"use client";

import { useState, useTransition } from "react";
import { startBuyerDiscoveryRun } from "@/lib/actions/buyers";

interface Props {
  verticalId: string;
}

export default function BuyerDiscoveryModal({ verticalId }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("verticalId", verticalId);
    startTransition(async () => {
      const result = await startBuyerDiscoveryRun(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      const newRunId = (result as { runId?: string }).runId;
      if (!newRunId) { setError("No runId returned."); return; }

      try {
        await fetch("/api/discovery/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: newRunId }),
        });
        setRunId(newRunId);
      } catch (err) {
        setError("Failed to start pipeline: " + String(err));
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost text-xs">
        Run Buyer Discovery
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => !isPending && setOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="card w-full max-w-lg p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-ink">Run Buyer Discovery</h2>
            <button onClick={() => setOpen(false)} disabled={isPending}
              className="text-ink-faint hover:text-ink transition-colors text-lg leading-none">×</button>
          </div>

          {runId ? (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="badge-approved">Running</span>
                <span className="font-mono text-xs text-ink-faint">{runId}</span>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                Buyer discovery is running in the background. Check <strong>Reports</strong> for progress. New buyers will appear in this list when found.
              </p>
              <button onClick={() => { setOpen(false); setRunId(null); }} className="btn-primary text-xs px-4 py-2">Done</button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1.5">Region *</label>
                <input name="region" required placeholder="e.g. Texas, Dallas TX, Southeast US"
                  className="input w-full" />
                <p className="font-mono text-2xs text-ink-faint mt-1">Where should we look for dental MSPs?</p>
              </div>

              <div>
                <label className="block font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1.5">Keywords</label>
                <input name="keywords"
                  placeholder="dental MSP, dental IT support, dental MSSP"
                  defaultValue="dental MSP managed services, dental IT support provider, dental MSSP cybersecurity"
                  className="input w-full" />
                <p className="font-mono text-2xs text-ink-faint mt-1">Comma-separated. Leave as default for best results.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1.5">Max Buyers</label>
                  <input name="maxCompanies" type="number" min={1} max={200} defaultValue={10} className="input w-full" />
                </div>
                <div>
                  <label className="block font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1.5">Max Pages</label>
                  <input name="maxPages" type="number" min={1} max={1000} defaultValue={30} className="input w-full" />
                </div>
              </div>

              {error && (
                <p className="font-mono text-xs text-rejected bg-rejected/10 border border-rejected/20 rounded px-3 py-2">{error}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={isPending}
                  className="btn-primary text-xs px-6 py-2 disabled:opacity-60">
                  {isPending ? "Starting…" : "Start Run"}
                </button>
                <button type="button" onClick={() => setOpen(false)} disabled={isPending} className="btn-ghost text-xs">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
