"use client";

import { useState, useTransition } from "react";
import { updateLead } from "@/lib/actions/records";

const STATUSES = ["approved", "rejected"];

interface Props {
  lead: {
    id: string;
    companyName: string;
    city: string | null;
    state: string | null;
    contactName: string | null;
    contactRole: string | null;
    contactEmail: string | null;
    whyNowReason: string | null;
    status: string;
  };
}

export default function EditLeadForm({ lead }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateLead(lead.id, fd);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs px-4 py-2">
        Edit Lead
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-10">
      <div className="bg-white border border-border rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-mono text-xs font-semibold text-ink uppercase tracking-wider">Edit Lead</h3>
          <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label text-xs">Company Name</label>
            <input name="companyName" defaultValue={lead.companyName} className="input w-full text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">City</label>
              <input name="city" defaultValue={lead.city ?? ""} className="input w-full text-xs" />
            </div>
            <div>
              <label className="form-label text-xs">State</label>
              <input name="state" defaultValue={lead.state ?? ""} className="input w-full text-xs" placeholder="TX" />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Status</label>
            <select name="status" defaultValue={lead.status} className="form-select text-xs py-2">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Name</label>
                <input name="contactName" defaultValue={lead.contactName ?? ""} className="input w-full text-xs" />
              </div>
              <div>
                <label className="form-label text-xs">Role</label>
                <input name="contactRole" defaultValue={lead.contactRole ?? ""} className="input w-full text-xs" />
              </div>
            </div>
            <div className="mt-3">
              <label className="form-label text-xs">Email</label>
              <input name="contactEmail" type="email" defaultValue={lead.contactEmail ?? ""} className="input w-full text-xs" />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Why-Now Reason</label>
            <textarea name="whyNowReason" defaultValue={lead.whyNowReason ?? ""} className="input w-full text-xs min-h-[80px]" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary text-xs px-5 py-2 disabled:opacity-60">
              {isPending ? "Saving…" : saved ? "Saved!" : "Save Changes"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
