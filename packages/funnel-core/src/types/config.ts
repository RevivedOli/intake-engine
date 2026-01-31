import type { AppTheme } from "./theme";
import type { ContactField } from "./contact";

export type FlowStep = "hero" | "questions" | "contact" | "result";

export interface HeroConfig {
  title?: string;
  body: string[];
  ctaLabel: string;
  /** Optional logo image (e.g. brand mark) shown above content */
  logoUrl?: string;
  imageUrl?: string;
  /** Optional line below CTA (e.g. social proof) */
  footerText?: string;
}

export interface AppConfig {
  theme: AppTheme;
  steps: FlowStep[];
  hero?: HeroConfig;
  contactFields: ContactField[];
  /** Optional image shown above the contact form */
  contactImageUrl?: string;
  /** Default thank-you message when n8n omits one (Mode A) */
  defaultThankYouMessage?: string;
  /** Optional copy above contact form (e.g. "Enter your details to receive free training.") */
  contactIntro?: string;
}
