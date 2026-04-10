import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProofSignal Labs – Exclusive, Evidence-Backed Dental Clinic Leads",
    template: "%s | ProofSignal Labs",
  },
  description:
    "ProofSignal Labs delivers exclusive, evidence-backed dental clinic leads to dental-focused MSPs and MSSPs. Qualified lead packets with confidence scores and verified contacts — not raw contact lists.",
  keywords: [
    "dental MSP leads",
    "dental clinic leads",
    "managed IT dental",
    "dental MSSP",
    "dental practice leads",
  ],
  openGraph: {
    title: "ProofSignal Labs",
    description: "Exclusive, evidence-backed dental clinic leads for dental-focused MSPs and MSSPs.",
    url: "https://proofsignallabs.com",
    siteName: "ProofSignal Labs",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Figtree:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
