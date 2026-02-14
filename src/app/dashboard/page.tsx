import Link from "next/link";
import { listTenants } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenants = await listTenants();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Tenants</h1>
      {tenants.length === 0 ? (
        <p className="text-zinc-400 mb-4">No tenants yet.</p>
      ) : (
        <ul className="space-y-2">
          {tenants.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-800 border border-zinc-700"
            >
              <div>
                <span className="font-medium">{t.name ?? "Unnamed"}</span>
                <span className="text-zinc-400 text-sm ml-2">
                  {t.domain ? `(${t.domain})` : "(no domain)"}
                </span>
              </div>
              <Link
                href={`/dashboard/tenants/${t.id}`}
                className="text-amber-400 hover:underline text-sm"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <Link
          href="/dashboard/new"
          className="inline-block px-4 py-2 rounded bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400"
        >
          Create new tenant
        </Link>
      </div>
    </div>
  );
}
