import { LogoMark } from "@/components/logo-mark";
import { SignupForm } from "@/components/signup-form";

/** Static shell — logged-in users are redirected by middleware. */
export const revalidate = 300;

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card p-8">
        <LogoMark />
        <h1 className="mt-4 text-2xl font-semibold text-[#0F2A4A]">Create your workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Self-serve org onboarding for pilots and evaluations. You become the organisation admin.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
