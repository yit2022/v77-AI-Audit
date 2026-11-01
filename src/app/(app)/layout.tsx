export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { Sidebar } from "@/components/sidebar";
import { OnboardingTour } from "@/components/onboarding-tour";
import { isLocale, type Locale } from "@/lib/i18n/dictionaries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) redirect("/login");
  const jar = await cookies();
  const raw = jar.get("v77_locale")?.value;
  const locale: Locale = isLocale(raw) ? raw : "en";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userName={session.name} orgName={session.orgName} role={session.role} locale={locale} />
      <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" tabIndex={-1}>
        {children}
      </main>
      <OnboardingTour userName={session.name} />
    </div>
  );
}
