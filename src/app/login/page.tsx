import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Sign in — ${COMPANY.productName}`,
  description: `Sign in to your ${COMPANY.productName} AI governance workspace.`,
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
          <div className="card p-8">
            <LogoMark />
            <div className="mt-4 text-sm text-slate-500">Loading sign-in…</div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
