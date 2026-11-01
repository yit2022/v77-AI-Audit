"use client";

import { useRouter } from "next/navigation";

type Org = {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  seatLimit: number;
  members: number;
  systems: number;
};

export function PlatformAdminClient({ orgs }: { orgs: Org[] }) {
  const router = useRouter();

  async function save(orgId: string) {
    const tier = (document.getElementById(`tier-${orgId}`) as HTMLSelectElement).value;
    const seatLimit = Number((document.getElementById(`seats-${orgId}`) as HTMLInputElement).value || 5);
    await fetch("/api/platform", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, planTier: tier, seatLimit }),
    });
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">Organisation</th>
            <th className="px-3 py-2">Members</th>
            <th className="px-3 py-2">Systems</th>
            <th className="px-3 py-2">Plan</th>
            <th className="px-3 py-2">Seats</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id} className="border-b border-slate-100">
              <td className="px-3 py-3">
                <div className="font-medium text-[#0F2A4A]">{o.name}</div>
                <div className="text-xs text-slate-500">{o.slug}</div>
              </td>
              <td className="px-3 py-3">{o.members}</td>
              <td className="px-3 py-3">{o.systems}</td>
              <td className="px-3 py-3">
                <select id={`tier-${o.id}`} className="select" defaultValue={o.planTier}>
                  <option value="pilot">pilot</option>
                  <option value="team">team</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </td>
              <td className="px-3 py-3">
                <input id={`seats-${o.id}`} className="input w-20" type="number" defaultValue={o.seatLimit} />
              </td>
              <td className="px-3 py-3">
                <button type="button" className="btn btn-secondary" onClick={() => void save(o.id)}>
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
