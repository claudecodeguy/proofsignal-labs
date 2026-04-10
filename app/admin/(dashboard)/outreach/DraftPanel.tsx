"use client";

import { useState, useTransition } from "react";
import { generateDraft, sendDraft, deleteDraft, suppressContact } from "@/lib/actions/outreach";

interface Buyer {
  id: string;
  buyerCompanyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactRole: string | null;
  territoryFocus: string | null;
}

interface Lead {
  id: string;
  companyName: string;
  city: string | null;
  state: string | null;
}

interface Props {
  buyers: Buyer[];
  approvedLeads: Lead[];
  suppressedCount: number;
}

type Stage = "compose" | "preview" | "sent";

export default function DraftPanel({ buyers, approvedLeads, suppressedCount }: Props) {
  const [stage, setStage] = useState<Stage>("compose");
  const [buyerId, setBuyerId] = useState("");
  const [emailType, setEmailType] = useState("initial");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ messageId: string; subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSuppress, setShowSuppress] = useState(false);
  const [suppressEmail, setSuppressEmail] = useState("");
  const [suppressDone, setSuppressDone] = useState(false);

  function toggleLead(id: string) {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("buyerId", buyerId);
    fd.set("emailType", emailType);
    selectedLeads.forEach((id) => fd.append("leadIds", id));

    startTransition(async () => {
      const result = await generateDraft(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setDraft({
        messageId: (result as { messageId: string }).messageId,
        subject: (result as { subject: string }).subject,
        body: (result as { body: string }).body,
      });
      setStage("preview");
    });
  }

  async function handleSend() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await sendDraft(draft.messageId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setStage("sent");
    });
  }

  async function handleDelete() {
    if (!draft) return;
    startTransition(async () => {
      await deleteDraft(draft.messageId);
      setDraft(null);
      setStage("compose");
    });
  }

  async function handleSuppress(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", suppressEmail);
    fd.set("reason", "manual");
    startTransition(async () => {
      await suppressContact(fd);
      setSuppressDone(true);
      setSuppressEmail("");
    });
  }

  function reset() {
    setStage("compose");
    setDraft(null);
    setError(null);
    setSelectedLeads([]);
    setBuyerId("");
  }

  const noBuyers = buyers.length === 0;
  const noLeads = approvedLeads.length === 0;

  return (
    <div className="space-y-5">
      {/* Draft panel */}
      <div className="card p-5">
        <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">
          {stage === "preview" ? "Review Draft" : stage === "sent" ? "Sent" : "Draft New Outreach"}
        </h3>

        {stage === "sent" && (
          <div>
            <p className="text-sm text-ink mb-4">Email sent successfully.</p>
            <button onClick={reset} className="btn-primary text-xs px-4 py-2">
              Draft Another
            </button>
          </div>
        )}

        {stage === "preview" && draft && (
          <div className="space-y-4">
            <div>
              <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-medium text-ink">{draft.subject}</p>
            </div>
            <div>
              <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1">Body</p>
              <div className="bg-canvas-subtle border border-border rounded p-3 text-sm text-ink-muted whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
                {draft.body}
              </div>
            </div>
            {error && (
              <p className="font-mono text-xs text-rejected bg-rejected/10 border border-rejected/20 rounded px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSend}
                disabled={isPending}
                className="btn-primary text-xs px-5 py-2 disabled:opacity-60"
              >
                {isPending ? "Sending…" : "Send Email"}
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="btn-ghost text-xs text-rejected"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {stage === "compose" && (
          <form onSubmit={handleGenerate} className="space-y-3">
            {noBuyers && (
              <p className="font-mono text-xs text-borderline bg-borderline/10 border border-borderline/20 rounded px-3 py-2">
                No buyers with contact emails yet. Add buyers in the Buyers section first.
              </p>
            )}

            <div>
              <label className="form-label text-xs">Buyer Contact *</label>
              <select
                className="form-select text-xs py-2"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                required
                disabled={noBuyers}
              >
                <option value="">Select buyer…</option>
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.contactName ? `${b.contactName} · ` : ""}{b.buyerCompanyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">Email Type</label>
              <select
                className="form-select text-xs py-2"
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
              >
                <option value="initial">Initial Outreach</option>
                <option value="followup">Follow-up</option>
                <option value="breakup">Breakup</option>
              </select>
            </div>

            {emailType === "initial" && (
              <div>
                <label className="form-label text-xs">
                  Attach Sample Leads{" "}
                  <span className="text-ink-faint font-normal">(optional)</span>
                </label>
                {noLeads ? (
                  <p className="font-mono text-2xs text-ink-faint">No approved leads yet.</p>
                ) : (
                  <div className="border border-border rounded p-3 space-y-2 max-h-40 overflow-y-auto">
                    {approvedLeads.slice(0, 20).map((lead) => (
                      <label
                        key={lead.id}
                        className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLead(lead.id)}
                        />
                        {lead.companyName}
                        {lead.city && lead.state && (
                          <span className="text-ink-faint">
                            — {lead.city}, {lead.state}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="font-mono text-xs text-rejected bg-rejected/10 border border-rejected/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || noBuyers || !buyerId}
              className="btn-primary w-full justify-center text-xs mt-1 disabled:opacity-60"
            >
              {isPending ? "Generating…" : "Generate Draft"}
            </button>
          </form>
        )}
      </div>

      {/* Suppression */}
      <div className="card p-5">
        <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
          Suppression
        </h3>
        <div className="space-y-2 text-xs font-mono mb-3">
          <div className="flex justify-between">
            <span className="text-ink-faint">Suppressed contacts</span>
            <span className="font-semibold text-ink">{suppressedCount}</span>
          </div>
        </div>

        {showSuppress ? (
          <form onSubmit={handleSuppress} className="space-y-2 mt-3">
            <input
              type="email"
              placeholder="email@example.com"
              value={suppressEmail}
              onChange={(e) => setSuppressEmail(e.target.value)}
              required
              className="input w-full text-xs"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60"
              >
                {isPending ? "Adding…" : "Suppress"}
              </button>
              <button
                type="button"
                onClick={() => { setShowSuppress(false); setSuppressDone(false); }}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
            {suppressDone && (
              <p className="font-mono text-2xs text-approved">Email suppressed.</p>
            )}
          </form>
        ) : (
          <button
            onClick={() => setShowSuppress(true)}
            className="btn-ghost w-full justify-center text-xs"
          >
            + Add to Suppression List
          </button>
        )}
      </div>
    </div>
  );
}
