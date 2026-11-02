import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";

export const revalidate = 300;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
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
