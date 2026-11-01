import { LogoMark } from "@/components/logo-mark";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card p-8">
        <LogoMark />
        <h1 className="mt-4 text-2xl font-semibold text-[#0F2A4A]">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we will send a reset link if an account exists. Links expire in 60 minutes.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
