import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V77 Trust — AI Auditor",
  description:
    "Global AI audit platform — EU AI Act, NIST AI RMF, and ISO/IEC 42001 crosswalk with technical assurance.",
  applicationName: "V77 Trust",
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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
