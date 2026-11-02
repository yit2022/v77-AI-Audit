import type { Metadata } from "next";
import "./globals.css";
import { getAppOrigin } from "@/lib/site";
import { CookieConsent } from "@/components/cookie-consent";
import { ErrorMonitor } from "@/components/error-monitor";

const origin = getAppOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(origin.startsWith("http") ? origin : "https://v77trust.com"),
  title: {
    default: "V77 Trust — AI Auditor",
    template: "%s · V77 Trust",
  },
  description:
    "Global AI audit platform — EU AI Act, NIST AI RMF, and ISO/IEC 42001 crosswalk with technical assurance.",
  applicationName: "V77 Trust",
  keywords: [
    "AI audit",
    "EU AI Act",
    "NIST AI RMF",
    "ISO 42001",
    "AI governance",
    "AI inventory",
    "AI compliance",
  ],
  authors: [{ name: "Vertex77 sp. z o.o." }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: origin,
    siteName: "V77 Trust",
    title: "V77 Trust — AI Auditor",
    description:
      "System of record and system of proof for AI governance across the EU AI Act, NIST AI RMF and ISO/IEC 42001.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "V77 Trust" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "V77 Trust — AI Auditor",
    description: "Global AI audit platform with inventory, crosswalk, evidence and technical evals.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/brand/v77-lockup.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
        <CookieConsent />
        <ErrorMonitor />
      </body>
    </html>
  );
}
