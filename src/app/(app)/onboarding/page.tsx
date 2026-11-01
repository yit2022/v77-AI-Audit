export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { getOrgChecklist } from "@/lib/onboarding/checklist";
import { PageHeader } from "@/components/ui";
import { OnboardingChecklistClient } from "@/components/onboarding-checklist-client";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) return null;
  const items = await getOrgChecklist(session.orgId);
  return (
    <div>
      <PageHeader
        title="Onboarding checklist"
        subtitle="Organisation-scoped getting-started steps for new tenants. Complements the in-app tour."
      />
      <OnboardingChecklistClient items={items} />
    </div>
  );
}
