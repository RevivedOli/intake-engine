import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-900 text-zinc-100">
      <h1 className="text-2xl font-semibold mb-4">Intake Engine</h1>
      <p className="text-zinc-400 mb-8 text-center max-w-md">
        Multi-tenant onboarding funnels. Pick an app to start.
      </p>
      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/apps/elliot-wise"
            className="text-amber-400 hover:underline"
          >
            Elliot Wise
          </Link>
        </li>
        <li>
          <Link
            href="/apps/lionstone"
            className="text-amber-400 hover:underline"
          >
            Lionstone
          </Link>
        </li>
        <li>
          <Link
            href="/apps/peace-for-nature"
            className="text-amber-400 hover:underline"
          >
            Peace for Nature
          </Link>
        </li>
        <li>
          <Link
            href="/apps/lionsden"
            className="text-amber-400 hover:underline"
          >
            Lions Den University
          </Link>
        </li>
      </ul>
    </main>
  );
}
