import { notFound } from "next/navigation";
import { getAppConfig, getAppQuestions } from "@/apps";
import { Funnel } from "./Funnel";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function AppPage({ params }: PageProps) {
  const { clientSlug } = await params;
  const config = await getAppConfig(clientSlug);
  if (!config) notFound();

  const questions =
    config.steps.includes("questions")
      ? await getAppQuestions(clientSlug)
      : [];

  return (
    <Funnel
      appId={clientSlug}
      config={config}
      questions={questions ?? []}
    />
  );
}
