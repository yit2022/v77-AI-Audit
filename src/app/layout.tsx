import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V77 AI Auditor",
  description: "Global AI audit platform — EU AI Act, NIST AI RMF, and ISO/IEC 42001 crosswalk with technical assurance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
