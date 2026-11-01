import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
          <div className="card p-8 text-sm text-slate-500">Loading sign-in…</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
