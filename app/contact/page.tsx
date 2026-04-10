"use client";

import { useState } from "react";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    email: "",
    company: "",
    region: "",
    message: "",
    requestSample: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <section className="border-b border-border bg-canvas-subtle py-12">
        <div className="max-w-3xl mx-auto px-6">
          <p className="section-label mb-3">Contact</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-3">
            Request a sample batch or ask us anything.
          </h1>
          <p className="text-ink-muted">
            We respond to all business inquiries within one business day.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-14 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
                Sample Batch
              </p>
              <p className="text-sm text-ink-muted leading-relaxed">
                We send 3–5 validated dental clinic leads from your target territory,
                free to qualified buyers. No commitment required.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
                Response Time
              </p>
              <p className="text-sm text-ink-muted">Within 1 business day.</p>
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
                Email
              </p>
              <p className="text-sm font-mono text-teal">hello@proofsignallabs.com</p>
            </div>
            <div className="border-t border-border pt-6">
              <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-2">Active vertical</p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                <span className="font-mono text-xs text-ink-muted">Dental MSP · US Market</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            {submitted ? (
              <div className="card p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-approved-bg border border-approved-border flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10L8 14L16 6" stroke="#1A6B45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="font-semibold text-lg text-ink mb-2">Message received.</h2>
                <p className="text-sm text-ink-muted">
                  We&apos;ll be in touch within one business day. If you requested a sample batch,
                  we&apos;ll follow up with questions about your territory before sending leads.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card p-6 space-y-5">
                <div>
                  <label className="form-label" htmlFor="email">
                    Business Email <span className="text-rejected">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@yourcompany.com"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="company">
                    Company Name <span className="text-rejected">*</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    required
                    placeholder="Your MSP or MSSP company name"
                    className="form-input"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="region">
                    Target Niche / Region
                  </label>
                  <input
                    id="region"
                    type="text"
                    placeholder="e.g. Dental MSPs · Texas, Arizona"
                    className="form-input"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-ink-faint font-mono">
                    Tell us which state or metro you&apos;re targeting. We&apos;ll confirm coverage.
                  </p>
                </div>

                <div>
                  <label className="form-label" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us about your practice focus, current lead challenges, or any questions you have."
                    className="form-textarea"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="requestSample"
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-border text-teal cursor-pointer"
                    checked={form.requestSample}
                    onChange={(e) => setForm({ ...form, requestSample: e.target.checked })}
                  />
                  <label htmlFor="requestSample" className="text-sm text-ink-muted cursor-pointer leading-relaxed">
                    <span className="font-medium text-ink">Request a free sample batch.</span>{" "}
                    We&apos;ll send 3–5 validated dental clinic leads from your territory after confirming coverage.
                  </label>
                </div>

                <div className="pt-2">
                  <button type="submit" className="btn-primary w-full justify-center">
                    Send Message
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <p className="text-2xs text-ink-faint font-mono text-center leading-relaxed">
                  We respect your privacy. This form is for business inquiries only.
                  We will never sell your contact information.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
