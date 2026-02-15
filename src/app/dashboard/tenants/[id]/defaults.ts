import type {
  AppConfig,
  CtaConfig,
  CtaMultiChoiceOption,
  CtaMultiChoiceOptionDiscount,
  CtaMultiChoiceOptionLink,
  CtaMultiChoiceOptionVideoDirect,
  CtaMultiChoiceOptionVideoSubChoice,
  CtaMultiChoiceOptionWebhook,
} from "@/types/config";
import type { Question } from "@/types/question";

const DEFAULT_THEME = {
  primaryColor: "#4a6b5a",
  background: "#0d1f18",
  fontFamily: "var(--font-sans)",
  layout: "centered" as const,
};

const DEFAULT_STEPS = ["hero", "questions", "result"] as const;

const DEFAULT_CTA: CtaConfig = { type: "thank_you", message: "Thank you." };

function normalizeCtaOption(raw: unknown, index: number): CtaMultiChoiceOption | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = typeof o.id === "string" ? o.id : `opt_${index + 1}`;
  const label = typeof o.label === "string" ? o.label : "Option";
  const kind = o.kind === "embed_video" || o.kind === "discount_code" || o.kind === "webhook_then_message" || o.kind === "link" ? o.kind : "embed_video";

  if (kind === "embed_video") {
    const variant = o.variant === "sub_choice" ? "sub_choice" : "direct";
    const normButton = (b: unknown) => {
      if (!b || typeof b !== "object") return undefined;
      const x = b as Record<string, unknown>;
      if (typeof x.label !== "string" || typeof x.url !== "string") return undefined;
      return { label: x.label, url: x.url, color: typeof x.color === "string" ? x.color : undefined };
    };
    if (variant === "direct") {
      return {
        id,
        label,
        kind: "embed_video",
        variant: "direct",
        videoUrl: typeof o.videoUrl === "string" ? o.videoUrl : "",
        title: typeof o.title === "string" ? o.title : undefined,
        subtitle: typeof o.subtitle === "string" ? o.subtitle : undefined,
        button: normButton(o.button),
      } satisfies CtaMultiChoiceOptionVideoDirect;
    }
    const choices = Array.isArray(o.choices)
      ? (o.choices as unknown[]).map((c: unknown, i: number) => {
          const x = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
          return {
            label: typeof x.label === "string" ? x.label : `Choice ${i + 1}`,
            videoUrl: typeof x.videoUrl === "string" ? x.videoUrl : "",
            title: typeof x.title === "string" ? x.title : undefined,
            subtitle: typeof x.subtitle === "string" ? x.subtitle : undefined,
            button: normButton(x.button),
          };
        })
      : [];
    const prompt = typeof o.prompt === "string" ? o.prompt : undefined;
    const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl : undefined;
    const title = o.title !== undefined && typeof o.title === "string" ? o.title : undefined;
    const subheading = o.subheading !== undefined && typeof o.subheading === "string" ? o.subheading : undefined;
    return { id, label, kind: "embed_video", variant: "sub_choice", title, subheading, prompt, imageUrl, choices } satisfies CtaMultiChoiceOptionVideoSubChoice;
  }

  if (kind === "discount_code") {
    return {
      id,
      label,
      kind: "discount_code",
      title: typeof o.title === "string" ? o.title : "",
      description: typeof o.description === "string" ? o.description : undefined,
      linkUrl: typeof o.linkUrl === "string" ? o.linkUrl : "",
      linkLabel: typeof o.linkLabel === "string" ? o.linkLabel : undefined,
      code: typeof o.code === "string" ? o.code : "",
    } satisfies CtaMultiChoiceOptionDiscount;
  }

  if (kind === "link") {
    return {
      id,
      label,
      kind: "link",
      url: typeof o.url === "string" ? o.url : "#",
      openInNewTab: Boolean(o.openInNewTab),
    } satisfies CtaMultiChoiceOptionLink;
  }

  return {
    id,
    label,
    kind: "webhook_then_message",
    webhookTag: typeof o.webhookTag === "string" ? o.webhookTag : "signup",
    thankYouMessage: typeof o.thankYouMessage === "string" ? o.thankYouMessage : "Thank you. We'll be in touch.",
    thankYouHeader: typeof o.thankYouHeader === "string" ? o.thankYouHeader : undefined,
    thankYouSubheading: typeof o.thankYouSubheading === "string" ? o.thankYouSubheading : undefined,
    webhookUrl: typeof o.webhookUrl === "string" ? o.webhookUrl : undefined,
  } satisfies CtaMultiChoiceOptionWebhook;
}

function normalizeCta(raw: unknown): CtaConfig {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const type = c.type === "thank_you" || c.type === "link" || c.type === "embed" || c.type === "multi_choice" ? c.type : "thank_you";

  if (type === "thank_you") {
    return { type: "thank_you", message: typeof c.message === "string" ? c.message : "Thank you." };
  }
  if (type === "link") {
    return {
      type: "link",
      label: typeof c.label === "string" ? c.label : "Continue",
      url: typeof c.url === "string" ? c.url : "#",
      openInNewTab: Boolean(c.openInNewTab),
    };
  }
  if (type === "embed") {
    const button = c.button && typeof c.button === "object" ? (c.button as Record<string, unknown>) : undefined;
    return {
      type: "embed",
      url: typeof c.url === "string" ? c.url : "",
      title: typeof c.title === "string" ? c.title : undefined,
      subtitle: typeof c.subtitle === "string" ? c.subtitle : undefined,
      textBelow: typeof c.textBelow === "string" ? c.textBelow : undefined,
      button: button && typeof button.label === "string" && typeof button.url === "string"
        ? { label: button.label, url: button.url, color: typeof button.color === "string" ? button.color : undefined }
        : undefined,
    };
  }
  const optionsRaw = Array.isArray(c.options) ? c.options : [];
  const options = optionsRaw.map((opt: unknown, i: number) => normalizeCtaOption(opt, i)).filter((o): o is CtaMultiChoiceOption => o !== null);
  return {
    type: "multi_choice",
    title: typeof c.title === "string" ? c.title : undefined,
    subheading: typeof c.subheading === "string" ? c.subheading : undefined,
    prompt: typeof c.prompt === "string" ? c.prompt : undefined,
    imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : undefined,
    options: options.length ? options : [{ id: "opt_1", label: "Option 1", kind: "embed_video", variant: "direct", videoUrl: "" }],
  };
}

export function normalizeConfig(raw: unknown): AppConfig {
  const c = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const theme = (c.theme && typeof c.theme === "object" ? c.theme : {}) as Record<string, unknown>;
  const hero = (c.hero && typeof c.hero === "object" ? c.hero : undefined) as Record<string, unknown> | undefined;
  const steps = Array.isArray(c.steps) ? c.steps.filter((s): s is AppConfig["steps"][number] => DEFAULT_STEPS.includes(s as never)) : [...DEFAULT_STEPS];

  return {
    theme: {
      primaryColor: typeof theme.primaryColor === "string" ? theme.primaryColor : DEFAULT_THEME.primaryColor,
      background: typeof theme.background === "string" ? theme.background : DEFAULT_THEME.background,
      fontFamily: typeof theme.fontFamily === "string" ? theme.fontFamily : DEFAULT_THEME.fontFamily,
      layout: (theme.layout === "left" || theme.layout === "full-width" ? theme.layout : "centered") as AppConfig["theme"]["layout"],
    },
    steps: steps.length ? steps : [...DEFAULT_STEPS],
    siteTitle: typeof c.siteTitle === "string" ? c.siteTitle : undefined,
    faviconUrl: typeof c.faviconUrl === "string" ? c.faviconUrl : undefined,
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
    defaultThankYouMessage: typeof c.defaultThankYouMessage === "string" ? c.defaultThankYouMessage : undefined,
    textQuestionButtonLabel: typeof c.textQuestionButtonLabel === "string" ? c.textQuestionButtonLabel : undefined,
    cta: c.cta !== undefined && c.cta !== null ? normalizeCta(c.cta) : DEFAULT_CTA,
  };
}

export function normalizeQuestions(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q: unknown, i: number) => {
    const x = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
    const id = typeof x.id === "string" ? x.id : `q${i + 1}`;
    const type = (x.type === "single" || x.type === "multi" || x.type === "text" || x.type === "contact" ? x.type : "single") as Question["type"];
    const question = typeof x.question === "string" ? x.question : "";
    const options = Array.isArray(x.options) ? x.options.filter((o): o is string => typeof o === "string") : [];
    const imageUrl = typeof x.imageUrl === "string" ? x.imageUrl : undefined;
    const submitButtonLabel = type === "text" && typeof x.submitButtonLabel === "string" ? x.submitButtonLabel : undefined;
    const contactKind = (x.contactKind === "email" || x.contactKind === "tel" || x.contactKind === "instagram" || x.contactKind === "text" ? x.contactKind : undefined) as Question["contactKind"];
    const label = typeof x.label === "string" ? x.label : undefined;
    const placeholder = typeof x.placeholder === "string" ? x.placeholder : undefined;
    const required = type === "contact" ? (x.required !== undefined ? Boolean(x.required) : true) : undefined;
    return {
      id,
      type,
      question,
      ...((type === "single" || type === "multi") ? { options } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(submitButtonLabel ? { submitButtonLabel } : {}),
      ...(type === "contact" ? { contactKind: contactKind ?? "email", label, placeholder, required } : {}),
    };
  });
}
