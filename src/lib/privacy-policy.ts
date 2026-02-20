import type { AppConfig } from "@/types/config";

export interface PrivacyPolicyLink {
  href: string;
  openInNewTab: boolean;
}

/**
 * Returns the privacy policy link for the consent checkbox.
 * Handles both legacy ({ enabled, content }) and new ({ mode, content, url }) config shapes.
 */
export function getPrivacyPolicyLink(config: AppConfig | undefined): PrivacyPolicyLink | null {
  const pp = config?.privacyPolicy;
  if (!pp || typeof pp !== "object") return null;

  const raw = pp as Record<string, unknown>;

  // New schema: mode "internal" | "external"
  if (raw.mode === "external") {
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!url) return null;
    return { href: url, openInNewTab: true };
  }
  if (raw.mode === "internal") {
    const content = typeof raw.content === "string" ? raw.content.trim() : "";
    if (!content) return null;
    return { href: "/privacy-policy", openInNewTab: true };
  }

  // Legacy schema: { enabled, content }
  if (raw.enabled && typeof raw.content === "string" && raw.content.trim()) {
    return { href: "/privacy-policy", openInNewTab: true };
  }

  return null;
}

/**
 * Whether consent checkbox should be required for contact forms.
 */
export function isConsentRequired(config: AppConfig | undefined): boolean {
  const pp = config?.privacyPolicy;
  if (!pp || typeof pp !== "object") return false;
  const raw = pp as Record<string, unknown>;
  if (raw.consentRequired === false) return false;
  return !!getPrivacyPolicyLink(config);
}

const DEFAULT_CONSENT_LABEL = "I agree to share my information in accordance with the Privacy Policy.";

/**
 * Returns the contact consent label. Use "Privacy Policy" in the text to embed the link.
 */
export function getContactConsentLabel(config: AppConfig | undefined): string {
  const label = config?.contactConsentLabel?.trim();
  return label || DEFAULT_CONSENT_LABEL;
}
