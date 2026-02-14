import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { AuthView } from "@neondatabase/auth/react/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let session: { user?: unknown } | null = null;
  try {
    const result = await auth.getSession();
    session = result?.data ?? null;
  } catch (err) {
    // Auth backend unreachable (e.g. wrong NEON_AUTH_BASE_URL or network)
    console.error("Login page: getSession failed", err);
  }
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-6 text-center">
          Intake Engine Admin
        </h1>
        <AuthView path="sign-in" />
      </div>
    </main>
  );
}
