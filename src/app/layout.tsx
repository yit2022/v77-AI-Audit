import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { getAppOrigin } from "@/lib/site";
import { CookieConsent } from "@/components/cookie-consent";
import { ErrorMonitor } from "@/components/error-monitor";
import { isLocale } from "@/lib/i18n/dictionaries";

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "V77 Trust",
      },
    ],
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const raw = jar.get("v77_locale")?.value;
  const lang = isLocale(raw) ? raw : "en";
  return (
    <html lang={lang}>
      <body className="min-h-screen antialiased">
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
