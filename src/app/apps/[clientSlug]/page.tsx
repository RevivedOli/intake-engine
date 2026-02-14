import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

/**
 * Funnel is now resolved by domain only. This route is deprecated; direct
 * access by path is disabled.
 */
export default async function AppPage(_props: PageProps) {
  notFound();
}
