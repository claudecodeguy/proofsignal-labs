import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin – ProofSignal Labs",
    template: "%s | Admin – ProofSignal Labs",
  },
  robots: { index: false, follow: false },
};

// Pass-through layout — sidebar is included via (dashboard) route group
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>;
}
