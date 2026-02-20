"use client";

import type { AppConfig } from "@/types/config";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";
const hintClass = "text-xs text-zinc-500 mt-1";

type PrivacyMode = "internal" | "external";

function getPrivacyMode(pp: AppConfig["privacyPolicy"]): PrivacyMode {
  if (!pp || typeof pp !== "object") return "internal";
  const raw = pp as Record<string, unknown>;
  if (raw.mode === "external") return "external";
  return "internal";
}

export function PrivacyPolicyFormFields({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}) {
  const pp = config.privacyPolicy;
  const mode = getPrivacyMode(pp);
  const content = (pp && typeof pp === "object" && "content" in pp && typeof (pp as { content?: string }).content === "string")
    ? (pp as { content: string }).content
    : "";
  const url = (pp && typeof pp === "object" && "url" in pp && typeof (pp as { url?: string }).url === "string")
    ? (pp as { url: string }).url
    : "";
  function updatePrivacy(
    patch:
      | { mode: "internal"; content?: string }
      | { mode: "external"; url?: string }
  ) {
    if (patch.mode === "external") {
      const u = (patch.url ?? url).trim();
      onChange({
        ...config,
        privacyPolicy: { mode: "external", url: u },
      });
      return;
    }
    const c = (patch.content ?? content).trim();
    onChange({
      ...config,
      privacyPolicy: { mode: "internal", content: c },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Privacy policy</p>
        <p className={hintClass}>
          Choose how to provide your privacy policy. The consent checkbox with a link appears only next to contact questions.
        </p>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="privacy-mode"
            checked={mode === "internal"}
            onChange={() => updatePrivacy({ mode: "internal", content })}
            className="border-zinc-500 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          <span>Create your own (Markdown)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="privacy-mode"
            checked={mode === "external"}
            onChange={() => updatePrivacy({ mode: "external", url })}
            className="border-zinc-500 bg-zinc-800 text-amber-500 focus:ring-amber-500"
          />
          <span>Link to external URL</span>
        </label>
      </div>

      {mode === "internal" && (
        <div>
          <label htmlFor="privacy-content" className={labelClass}>
            Privacy policy content (Markdown)
          </label>
          <textarea
            id="privacy-content"
            value={content}
            onChange={(e) => updatePrivacy({ mode: "internal", content: e.target.value })}
            rows={16}
            className={`${inputClass} font-mono text-sm resize-y`}
            placeholder="# Privacy Policy&#10;&#10;Enter your privacy policy in Markdown. Links will open in a new tab.&#10;&#10;Example:&#10;[Contact us](https://example.com/contact)"
          />
          <p className={hintClass}>
            Served at your domain /privacy-policy. Supports Markdown: headings, lists, links, bold, etc.
          </p>
        </div>
      )}

      {mode === "external" && (
        <div>
          <label htmlFor="privacy-url" className={labelClass}>
            External privacy policy URL
          </label>
          <input
            id="privacy-url"
            type="url"
            value={url}
            onChange={(e) => updatePrivacy({ mode: "external", url: e.target.value })}
            placeholder="https://example.com/privacy-policy"
            className={inputClass}
          />
          <p className={hintClass}>
            The &quot;Privacy Policy&quot; link will open this URL in a new tab.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="contact-consent-label" className={labelClass}>
          Contact consent checkbox text
        </label>
        <textarea
          id="contact-consent-label"
          value={config.contactConsentLabel ?? ""}
          onChange={(e) => onChange({ ...config, contactConsentLabel: e.target.value.trim() || undefined })}
          rows={3}
          className={`${inputClass} text-sm resize-y`}
          placeholder="I agree to be contacted by TheLionGlass LTD regarding my enquiry and related services. Privacy Policy applies. Unsubscribe anytime."
        />
        <p className={hintClass}>
          Shown under contact fields. Include &quot;Privacy Policy&quot; to add the link. Leave blank for the default.
        </p>
      </div>
    </div>
  );
}
