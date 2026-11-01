export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={session.name}
        orgName={session.orgName}
        role={session.role}
      />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
