"use client";

import { useState, useTransition } from "react";
import { updateBuyer } from "@/lib/actions/records";

const STAGES = [
  "discovered", "enriched", "ready_for_outreach", "sample_sent",
  "engaged", "pilot_discussion", "pilot_active", "closed_won", "closed_lost", "suppressed",
];

interface Props {
  buyer: {
    id: string;
    buyerCompanyName: string;
    domain: string;
    buyerCity: string | null;
    buyerState: string | null;
    territoryFocus: string | null;
    contactName: string | null;
    contactRole: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    stage: string;
    notes: string | null;
    buyerServices: string | null;
  };
}

export default function EditBuyerForm({ buyer }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateBuyer(buyer.id, fd);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1000);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs px-4 py-2">
        Edit Buyer
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-10">
      <div className="bg-white border border-border rounded-lg shadow-xl w-full max-w-xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-mono text-xs font-semibold text-ink uppercase tracking-wider">Edit Buyer</h3>
          <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">Company Name</label>
              <input name="buyerCompanyName" defaultValue={buyer.buyerCompanyName} className="input w-full text-xs" />
            </div>
            <div>
              <label className="form-label text-xs">Domain</label>
              <input name="domain" defaultValue={buyer.domain} className="input w-full text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">City</label>
              <input name="buyerCity" defaultValue={buyer.buyerCity ?? ""} className="input w-full text-xs" />
            </div>
            <div>
              <label className="form-label text-xs">State</label>
              <input name="buyerState" defaultValue={buyer.buyerState ?? ""} className="input w-full text-xs" placeholder="TX" />
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Territory Focus</label>
            <input name="territoryFocus" defaultValue={buyer.territoryFocus ?? ""} className="input w-full text-xs" placeholder="e.g. Texas, DFW" />
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Name</label>
                <input name="contactName" defaultValue={buyer.contactName ?? ""} className="input w-full text-xs" />
              </div>
              <div>
                <label className="form-label text-xs">Role</label>
                <input name="contactRole" defaultValue={buyer.contactRole ?? ""} className="input w-full text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="form-label text-xs">Email</label>
                <input name="contactEmail" type="email" defaultValue={buyer.contactEmail ?? ""} className="input w-full text-xs" />
              </div>
              <div>
                <label className="form-label text-xs">Phone</label>
                <input name="contactPhone" defaultValue={buyer.contactPhone ?? ""} className="input w-full text-xs" />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label text-xs">Stage</label>
                <select name="stage" defaultValue={buyer.stage} className="form-select text-xs py-2">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label text-xs">Buyer Services</label>
            <textarea name="buyerServices" defaultValue={buyer.buyerServices ?? ""} className="input w-full text-xs min-h-[60px]" />
          </div>

          <div>
            <label className="form-label text-xs">Notes</label>
            <textarea name="notes" defaultValue={buyer.notes ?? ""} className="input w-full text-xs min-h-[60px]" />
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
