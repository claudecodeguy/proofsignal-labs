"use client";

import { useState, useTransition } from "react";
import { logReply, syncFromInstantly } from "@/lib/actions/outreach";

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-neutral",
  sent: "badge-teal",
  replied: "badge-approved",
  bounced: "badge-rejected",
  unsubscribed: "badge-rejected",
};

const TYPE_LABEL: Record<string, string> = {
  initial: "Initial",
  followup: "Follow-up",
  breakup: "Breakup",
};

interface Message {
  id: string;
  buyerCompanyName: string;
  contactName: string | null;
  contactEmail: string | null;
  subject: string;
  emailType: string;
  leadsCount: number;
  status: string;
  sentAt: string | null;
  replyText: string | null;
  instantlyLeadId: string | null;
}

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogReplyModal({
  messageId,
  onClose,
}: {
  messageId: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logReply(messageId, text);
      setDone(true);
      setTimeout(onClose, 800);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white border border-border rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
          Log Reply
        </h3>
        {done ? (
          <p className="font-mono text-xs text-approved">Reply logged. Buyer stage updated to Engaged.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="input w-full text-xs min-h-[120px]"
              placeholder="Paste the reply text here (optional — can leave blank)"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary text-xs px-5 py-2 disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Save Reply"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MessageLog({ messages }: { messages: Message[] }) {
  const [logReplyId, setLogReplyId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isSyncing, startSync] = useTransition();

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      const result = await syncFromInstantly();
      if ("error" in result && result.error) {
        setSyncResult(`Error: ${result.error}`);
      } else {
        const r = result as { updated: number; total: number };
        setSyncResult(
          r.updated > 0
            ? `Synced ${r.updated} update${r.updated !== 1 ? "s" : ""} from ${r.total} sent messages.`
            : `All ${r.total} sent messages up to date.`
        );
      }
    });
  }

  const hasSentViaInstantly = messages.some(
    (m) => m.status === "sent" && m.instantlyLeadId
  );

  return (
    <>
      {logReplyId && (
        <LogReplyModal
          messageId={logReplyId}
          onClose={() => setLogReplyId(null)}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider">
          Message Log
        </h2>
        <div className="flex items-center gap-3">
          {syncResult && (
            <span className="font-mono text-2xs text-ink-muted">{syncResult}</span>
          )}
          <button
            onClick={handleSync}
            disabled={isSyncing || !hasSentViaInstantly}
            className="btn-primary text-xs px-4 py-2 disabled:opacity-40"
            title={!hasSentViaInstantly ? "No sent Instantly messages to sync" : ""}
          >
            {isSyncing ? "Syncing…" : "↻ Sync from Instantly"}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {messages.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Leads</th>
                <th>Status</th>
                <th>Sent</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg) => (
                <tr key={msg.id}>
                  <td>
                    <p className="font-medium text-sm text-ink">{msg.buyerCompanyName}</p>
                    <p className="font-mono text-2xs text-ink-faint">
                      {msg.contactName ?? msg.contactEmail ?? "—"}
                    </p>
                  </td>
                  <td>
                    <span className="text-sm text-ink-muted line-clamp-1">{msg.subject}</span>
                  </td>
                  <td>
                    <span className="badge-neutral">
                      {TYPE_LABEL[msg.emailType] ?? msg.emailType}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-muted">
                      {msg.leadsCount > 0 ? `${msg.leadsCount} attached` : "—"}
                    </span>
                  </td>
                  <td>
                    <div>
                      <span className={STATUS_BADGE[msg.status] ?? "badge-neutral"}>
                        {msg.status}
                      </span>
                      {msg.replyText && (
                        <p
                          className="font-mono text-2xs text-ink-faint mt-1 line-clamp-1 max-w-[180px]"
                          title={msg.replyText}
                        >
                          {msg.replyText}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-faint">
                      {formatDt(msg.sentAt)}
                    </span>
                  </td>
                  <td>
                    {msg.status === "sent" && (
                      <button
                        onClick={() => setLogReplyId(msg.id)}
                        className="btn-primary text-xs px-3 py-1.5 whitespace-nowrap"
                      >
                        Log Reply
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-14 text-center">
            <p className="font-mono text-xs text-ink-faint">No messages yet.</p>
            <p className="text-sm text-ink-muted mt-1">
              Use the draft panel to generate and send your first outreach.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
