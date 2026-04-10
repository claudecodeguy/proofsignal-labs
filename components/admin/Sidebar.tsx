"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/admin",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Companies",
    href: "/admin/companies",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="3" width="13" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 6H14" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 3V2M10 3V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3 2H12C12.3 2 12.5 2.2 12.5 2.5V12.5C12.5 12.8 12.3 13 12 13H3C2.7 13 2.5 12.8 2.5 12.5V2.5C2.5 2.2 2.7 2 3 2Z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 5.5H10M5 7.5H10M5 9.5H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Buyers",
    href: "/admin/buyers",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 13C2 10.2 4.5 8 7.5 8S13 10.2 13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Outreach",
    href: "/admin/outreach",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="3" width="13" height="9" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1 4L7.5 8.5L14 4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    label: "Exclusivity",
    href: "/admin/exclusivity",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="3" y="7" width="9" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 7V4.5C5 3.1 6.1 2 7.5 2S10 3.1 10 4.5V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="7.5" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="13" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 10V8M7 10V6M10 10V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7.5 1.5V3M7.5 12V13.5M13.5 7.5H12M3 7.5H1.5M11.7 3.3L10.6 4.4M4.4 10.6L3.3 11.7M11.7 11.7L10.6 10.6M4.4 4.4L3.3 3.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-navy flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-sm bg-teal flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-white">
              <rect x="0" y="0" width="5" height="5" fill="currentColor" opacity="0.7" />
              <rect x="7" y="0" width="5" height="5" fill="currentColor" />
              <rect x="0" y="7" width="5" height="5" fill="currentColor" />
              <rect x="7" y="7" width="5" height="5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white leading-tight">ProofSignal Labs</p>
            <p className="font-mono text-2xs text-navy-text-muted leading-tight">Admin</p>
          </div>
        </Link>
      </div>

      {/* Vertical indicator */}
      <div className="px-4 py-3 border-b border-navy-border">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-light" />
          <span className="font-mono text-2xs text-navy-text-muted">dental_msp_us</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link",
                isActive && "active"
              )}
            >
              <span className="opacity-70">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-navy-border">
        <Link
          href="/admin/login"
          className="flex items-center gap-2 text-xs text-navy-text-muted hover:text-navy-text transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 2H2C1.4 2 1 2.4 1 3V10C1 10.6 1.4 11 2 11H5M9 9L12 6.5M12 6.5L9 4M12 6.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sign out
        </Link>
      </div>
    </aside>
  );
}
