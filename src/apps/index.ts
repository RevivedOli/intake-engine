import type { AppConfig } from "@/types";
import type { Question } from "@/types";

/** Known app slugs (convention: folder under apps/). Add new clients here. */
export const KNOWN_APPS = ["elliot-wise", "lionstone", "peace-for-nature", "lionsden"] as const;

export type AppSlug = (typeof KNOWN_APPS)[number];

export function isKnownApp(slug: string): slug is AppSlug {
  return (KNOWN_APPS as readonly string[]).includes(slug);
}

const configLoaders: Record<AppSlug, () => Promise<{ default: AppConfig }>> = {
  "elliot-wise": () => import("./elliot-wise/config"),
  lionstone: () => import("./lionstone/config"),
  "peace-for-nature": () => import("./peace-for-nature/config"),
  lionsden: () => import("./lionsden/config"),
};

const questionLoaders: Record<AppSlug, () => Promise<{ default: Question[] }>> = {
  "elliot-wise": () => import("./elliot-wise/questions").then((m) => ({ default: m.questions })),
  lionstone: () => import("./lionstone/questions").then((m) => ({ default: m.questions })),
  "peace-for-nature": () => import("./peace-for-nature/questions").then((m) => ({ default: m.questions })),
  lionsden: () => import("./lionsden/questions").then((m) => ({ default: m.questions })),
};

export async function getAppConfig(slug: string): Promise<AppConfig | null> {
  if (!isKnownApp(slug)) return null;
  try {
    const mod = await configLoaders[slug]();
    return mod.default;
  } catch {
    return null;
  }
}

export async function getAppQuestions(slug: string): Promise<Question[] | null> {
  if (!isKnownApp(slug)) return null;
  try {
    const mod = await questionLoaders[slug]();
    return mod.default;
  } catch {
    return null;
  }
}
