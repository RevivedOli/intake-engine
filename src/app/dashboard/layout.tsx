import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: { user?: { email?: string } } | null = null;
  try {
    const result = await auth.getSession();
    session = result?.data ?? null;
  } catch (err) {
    console.error("Dashboard: getSession failed", err);
  }
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="border-b border-zinc-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/dashboard" className="text-lg font-semibold text-amber-400">
            Intake Engine Admin
          </Link>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Tenants
            </Link>
            <Link href="/dashboard/new" className="text-zinc-300 hover:text-white">
              New tenant
            </Link>
            <span className="text-zinc-500 text-sm">{session.user.email}</span>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">{children}</main>
    </div>
  );
}
