"use client";

import Link from "next/link";
import { useState } from "react";

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-canvas/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded-sm bg-teal flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-white"
              >
                <rect x="0" y="0" width="5" height="5" fill="currentColor" opacity="0.7" />
                <rect x="7" y="0" width="5" height="5" fill="currentColor" />
                <rect x="0" y="7" width="5" height="5" fill="currentColor" />
                <rect x="7" y="7" width="5" height="5" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-ink tracking-tight">
              ProofSignal Labs
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/methodology" className="nav-link">Methodology</Link>
            <Link href="/dental-it-leads" className="nav-link">Dental IT Leads</Link>
            <Link href="/sample-lead" className="nav-link">Sample Lead</Link>
            <Link href="/contact" className="nav-link">Contact</Link>
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="btn-primary text-xs px-4 py-2">
              Request Sample
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-ink-muted hover:text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {mobileOpen ? (
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-1 animate-fade-up">
            {[
              ["Methodology", "/methodology"],
              ["Dental IT Leads", "/dental-it-leads"],
              ["Sample Lead", "/sample-lead"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="block px-2 py-2.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-3">
              <Link href="/contact" className="btn-primary w-full justify-center text-xs">
                Request Sample
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
