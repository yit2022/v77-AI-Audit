export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/store";
import { PageHeader } from "@/components/ui";
import { NotificationsPageClient } from "@/components/notifications-page-client";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;
  const rows = await listNotifications({ orgId: session.orgId, userId: session.userId, limit: 100 });
  return (
    <div>
      <PageHeader title="Notification centre" subtitle="In-app alerts for your organisation. V77 does not send email from this screen." />
      <NotificationsPageClient
        initial={rows.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          href: n.href,
          kind: n.kind,
          read: Boolean(n.readAt),
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
        }))}
      />
    </div>
  );
}
