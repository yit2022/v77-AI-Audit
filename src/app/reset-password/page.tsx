import { Suspense } from "react";
import { LogoMark } from "@/components/logo-mark";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card p-8">
        <LogoMark />
        <h1 className="mt-4 text-2xl font-semibold text-[#0F2A4A]">Set a new password</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a new password for your V77 Trust account.</p>
        <Suspense fallback={<p className="mt-4 text-sm text-slate-500">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
