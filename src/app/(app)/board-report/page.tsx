export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BoardReportPage() {
  const session = await getSession();
  if (!session) return null;
  const locale = await getRequestLocale();
  return (
    <div className="space-y-6">
      <PageHeader title={t(locale, "board.title")} subtitle={t(locale, "board.subtitle")} />
      <div className="card space-y-4 p-6">
        <p className="text-sm text-slate-600">{t(locale, "board.body")}</p>
        <a className="btn btn-primary inline-flex" href="/api/reports/board">
          {t(locale, "board.download")}
        </a>
        <p className="text-xs text-slate-500">{t(locale, "board.note")}</p>
      </div>
    </div>
  );
}
