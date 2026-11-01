export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { Sidebar } from "@/components/sidebar";
import { OnboardingTour } from "@/components/onboarding-tour";
import { NotificationsBell } from "@/components/notifications-bell";
import { TrialBanner } from "@/components/trial-banner";
import { getOrgAccess } from "@/lib/billing/trial";
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
  const access = await getOrgAccess(session.orgId);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userName={session.name} orgName={session.orgName} role={session.role} locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col">
        {access ? <TrialBanner access={access} /> : null}
        <div className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-[#d7e6ef] bg-white/95 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
          <NotificationsBell />
        </div>
        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>
      <OnboardingTour userName={session.name} />
    </div>
  );
}
