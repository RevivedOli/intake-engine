import type { AppConfig } from "@/types/config";
import type { ContactField } from "@/types/contact";
import type { Question } from "@/types/question";

const DEFAULT_THEME = {
  primaryColor: "#4a6b5a",
  background: "#0d1f18",
  fontFamily: "var(--font-sans)",
  layout: "centered" as const,
};

const DEFAULT_STEPS = ["hero", "questions", "contact", "result"] as const;

const DEFAULT_CONTACT_FIELDS: ContactField[] = [
  { id: "email", type: "email", label: "Email", required: true },
];

export function normalizeConfig(raw: unknown): AppConfig {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const theme = (c.theme && typeof c.theme === "object" ? c.theme : {}) as Record<string, unknown>;
  const hero = (c.hero && typeof c.hero === "object" ? c.hero : undefined) as Record<string, unknown> | undefined;
  const steps = Array.isArray(c.steps) ? c.steps.filter((s): s is AppConfig["steps"][number] => DEFAULT_STEPS.includes(s as never)) : [...DEFAULT_STEPS];
  const contactFields = Array.isArray(c.contactFields) ? c.contactFields.map((f: unknown) => {
    const x = f && typeof f === "object" ? (f as Record<string, unknown>) : {};
    return {
      id: typeof x.id === "string" ? x.id : "email",
      type: (x.type === "email" || x.type === "tel" || x.type === "text" ? x.type : "email") as "email" | "tel" | "text",
      label: typeof x.label === "string" ? x.label : "Email",
      required: Boolean(x.required),
      placeholder: typeof x.placeholder === "string" ? x.placeholder : undefined,
    };
  }) : [...DEFAULT_CONTACT_FIELDS];
  if (contactFields.length === 0) contactFields.push(...DEFAULT_CONTACT_FIELDS);

  return {
    theme: {
      primaryColor: typeof theme.primaryColor === "string" ? theme.primaryColor : DEFAULT_THEME.primaryColor,
      background: typeof theme.background === "string" ? theme.background : DEFAULT_THEME.background,
      fontFamily: typeof theme.fontFamily === "string" ? theme.fontFamily : DEFAULT_THEME.fontFamily,
      layout: (theme.layout === "left" || theme.layout === "full-width" ? theme.layout : "centered") as AppConfig["theme"]["layout"],
    },
    steps: steps.length ? steps : [...DEFAULT_STEPS],
    hero: hero
      ? {
          title: typeof hero.title === "string" ? hero.title : "",
          body: Array.isArray(hero.body) ? hero.body.filter((b): b is string => typeof b === "string") : [],
          ctaLabel: typeof hero.ctaLabel === "string" ? hero.ctaLabel : "Get started",
          buttonLabel: typeof hero.buttonLabel === "string" ? hero.buttonLabel : undefined,
          logoUrl: typeof hero.logoUrl === "string" ? hero.logoUrl : undefined,
          imageUrl: typeof hero.imageUrl === "string" ? hero.imageUrl : undefined,
          footerText: typeof hero.footerText === "string" ? hero.footerText : undefined,
        }
      : undefined,
    contactFields,
    contactIntro: typeof c.contactIntro === "string" ? c.contactIntro : undefined,
    contactImageUrl: typeof c.contactImageUrl === "string" ? c.contactImageUrl : undefined,
    defaultThankYouMessage: typeof c.defaultThankYouMessage === "string" ? c.defaultThankYouMessage : undefined,
    textQuestionButtonLabel: typeof c.textQuestionButtonLabel === "string" ? c.textQuestionButtonLabel : undefined,
  };
}

export function normalizeQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q: unknown, i: number) => {
    const x = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
    const id = typeof x.id === "string" ? x.id : `q${i + 1}`;
    const type = (x.type === "single" || x.type === "multi" || x.type === "text" ? x.type : "single") as Question["type"];
    const question = typeof x.question === "string" ? x.question : "";
    const options = Array.isArray(x.options) ? x.options.filter((o): o is string => typeof o === "string") : [];
    const imageUrl = typeof x.imageUrl === "string" ? x.imageUrl : undefined;
    const submitButtonLabel = type === "text" && typeof x.submitButtonLabel === "string" ? x.submitButtonLabel : undefined;
    return {
      id,
      type,
      question,
      ...(options.length || type !== "text" ? { options } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(submitButtonLabel ? { submitButtonLabel } : {}),
    };
  });
}
