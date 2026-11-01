export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { listApprovals } from "@/lib/approvals";
import { canApprove, canWrite, isReadOnly } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/ui";
import { ApprovalsClient } from "@/components/approvals-client";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) return null;
  const approvals = await listApprovals(session.orgId);
  return (
    <div>
      <PageHeader
        title="Approvals"
        subtitle="Audit-ready review workflow. Reviewers and owners decide; auditors remain read-only."
      />
      <ApprovalsClient
        canDecide={canApprove(session.role)}
        canRequest={canWrite(session.role) || canApprove(session.role)}
        approvals={approvals.map((a) => ({
          id: a.id,
          title: a.title,
          entityType: a.entityType,
          entityId: a.entityId,
          status: a.status,
          decisionNote: a.decisionNote,
          createdAt: a.createdAt,
        }))}
      />
      {isReadOnly(session.role) ? (
        <p className="mt-4 text-sm text-amber-800">Your role is auditor (read-only).</p>
      ) : null}
    </div>
  );
}
