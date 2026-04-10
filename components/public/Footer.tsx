import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-canvas-subtle">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-5 h-5 rounded-sm bg-teal flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-white">
                  <rect x="0" y="0" width="5" height="5" fill="currentColor" opacity="0.7" />
                  <rect x="7" y="0" width="5" height="5" fill="currentColor" />
                  <rect x="0" y="7" width="5" height="5" fill="currentColor" />
                  <rect x="7" y="7" width="5" height="5" fill="currentColor" opacity="0.4" />
                </svg>
              </div>
              <span className="font-semibold text-sm text-ink">ProofSignal Labs</span>
            </Link>
            <p className="text-sm text-ink-muted leading-relaxed max-w-xs">
              Exclusive, evidence-backed dental clinic leads for dental-focused MSPs and MSSPs.
              Every lead arrives with source evidence and a confidence score.
            </p>
            <div className="mt-5">
              <span className="font-mono text-xs text-ink-faint">proofsignallabs.com</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Product</p>
            <ul className="space-y-2.5">
              {[
                ["Methodology", "/methodology"],
                ["Dental IT Leads", "/dental-it-leads"],
                ["Sample Lead Packet", "/sample-lead"],
                ["Request Sample", "/contact"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Company</p>
            <ul className="space-y-2.5">
              {[
                ["Contact", "/contact"],
                ["Admin Login", "/admin/login"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-ink-faint">
            © 2026 ProofSignal Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-1 font-mono text-xs text-ink-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block"></span>
            <span>Dental MSP vertical active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
