import type { AppTheme } from "./theme";

export type FlowStep = "hero" | "questions" | "result";

export interface HeroConfig {
  title?: string;
  body: string[];
  /** Small line of text above the button (e.g. "Get started" or "Take these 6 questions...") */
  ctaLabel: string;
  /** Button text (e.g. "Start", "Get started"). If omitted, falls back to ctaLabel. */
  buttonLabel?: string;
  /** Optional logo image (e.g. brand mark) shown above content */
  logoUrl?: string;
  imageUrl?: string;
  /** Optional line below CTA (e.g. social proof) */
  footerText?: string;
}

// --- CTA (post-submit) config ---

export interface CtaThankYou {
  type: "thank_you";
  message?: string;
}

export interface CtaLink {
  type: "link";
  label: string;
  url: string;
  openInNewTab?: boolean;
}

export interface CtaEmbed {
  type: "embed";
  url: string;
  title?: string;
  subtitle?: string;
  textBelow?: string;
  button?: { label: string; url: string; color?: string };
}

/** One option in a multi-choice CTA: admin-defined label + one of four action kinds */
export type CtaMultiChoiceOption =
  | CtaMultiChoiceOptionVideoDirect
  | CtaMultiChoiceOptionVideoSubChoice
  | CtaMultiChoiceOptionDiscount
  | CtaMultiChoiceOptionWebhook
  | CtaMultiChoiceOptionLink;

export interface CtaMultiChoiceOptionLink {
  id: string;
  label: string;
  kind: "link";
  url: string;
  openInNewTab?: boolean;
}

export interface CtaMultiChoiceOptionVideoDirect {
  id: string;
  label: string;
  kind: "embed_video";
  variant: "direct";
  videoUrl: string;
  title?: string;
  subtitle?: string;
  button?: { label: string; url: string; color?: string };
}

export interface CtaMultiChoiceOptionVideoSubChoice {
  id: string;
  label: string;
  kind: "embed_video";
  variant: "sub_choice";
  /** Title on sub-choice step. undefined = use main CTA title, "" = no title, string = override. */
  title?: string;
  /** Sub-heading on sub-choice step. undefined = use main CTA subheading, "" = none, string = override. */
  subheading?: string;
  /** Prompt shown above sub-choices (e.g. "Pick a topic:"). Falls back to main CTA prompt if not set. */
  prompt?: string;
  /** Image above sub-choices. Falls back to main CTA image if not set. */
  imageUrl?: string;
  choices: { label: string; videoUrl: string; title?: string; subtitle?: string; button?: { label: string; url: string; color?: string } }[];
}

export interface CtaMultiChoiceOptionDiscount {
  id: string;
  label: string;
  kind: "discount_code";
  title: string;
  description?: string;
  linkUrl: string;
  linkLabel?: string;
  code: string;
}

export interface CtaMultiChoiceOptionWebhook {
  id: string;
  label: string;
  kind: "webhook_then_message";
  webhookTag: string;
  thankYouMessage: string;
  /** Optional header shown above the thank you message */
  thankYouHeader?: string;
  /** Optional sub-heading shown below header, above the message */
  thankYouSubheading?: string;
  webhookUrl?: string;
}

export interface CtaMultiChoice {
  type: "multi_choice";
  /** Optional title at top of CTA page (e.g. "What's next?") */
  title?: string;
  /** Optional sub-heading below title */
  subheading?: string;
  prompt?: string;
  /** Optional image shown above the multi-choice options (ImageKit URL) */
  imageUrl?: string;
  options: CtaMultiChoiceOption[];
  /** When true, show option labels (greyed) below the contact form on the last step */
  showPreviewOnContactStep?: boolean;
}

export type CtaConfig =
  | CtaThankYou
  | CtaLink
  | CtaEmbed
  | CtaMultiChoice;

// --- Announcement banner (top strip) ---

export interface AnnouncementConfig {
  /** Whether the banner is visible */
  enabled: boolean;
  /** Message text (e.g. "Sale ends 15th October" or "Free shipping on orders over £50") */
  message: string;
  /** Background colour (hex, e.g. #c41e3a) */
  backgroundColor: string;
  /** Text colour (hex, e.g. #ffffff) */
  textColor: string;
  /** "hero" = only on hero step; "full" = on all steps (hero, questions, result) */
  scope: "hero" | "full";
}

/** Resolved view when showing one outcome of a multi-choice CTA (or direct CTA) */
export type CtaResolvedView =
  | { kind: "thank_you"; message: string; header?: string; subheading?: string }
  | { kind: "link"; label: string; url: string; openInNewTab?: boolean }
  | { kind: "embed"; url: string; title?: string; subtitle?: string; textBelow?: string; button?: { label: string; url: string; color?: string } }
  | { kind: "discount"; title: string; description?: string; linkUrl: string; linkLabel?: string; code: string }
  | { kind: "embed_video"; videoUrl: string; title?: string; subtitle?: string; button?: { label: string; url: string; color?: string } };

export interface AppConfig {
  theme: AppTheme;
  steps: FlowStep[];
  /** Optional browser tab title (fallback: tenant name) */
  siteTitle?: string;
  /** Optional favicon URL (image) */
  faviconUrl?: string;
  hero?: HeroConfig;
  /** Default thank-you message when n8n omits one (Mode A) */
  defaultThankYouMessage?: string;
  /** Button label for text-type questions (e.g. "OK", "Next", "Submit"). Defaults to "OK". */
  textQuestionButtonLabel?: string;
  /** Post-submit CTA: what to show after lead submits (in-app; n8n is fire-and-forget) */
  cta?: CtaConfig;
  /** Privacy policy: internal (Markdown at /privacy-policy) or external URL link */
  privacyPolicy?:
    | { mode: "internal"; content?: string }
    | { mode: "external"; url?: string }
    | { enabled: boolean; content: string }; /** @deprecated use mode */
  /** Contact consent checkbox label. Shown under contact fields. Include "Privacy Policy" to add the link. */
  contactConsentLabel?: string;
  /** Announcement banner (thin strip at top) */
  announcement?: AnnouncementConfig;
}
