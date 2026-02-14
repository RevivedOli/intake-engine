"use client";

import { useState } from "react";
import type { AppConfig, FlowStep } from "@/types/config";
import type { ContactField } from "@/types/contact";
import { ImageUrlField } from "@/components/ImageUrlField";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";
const hintClass = "text-xs text-zinc-500 mt-1";

const FLOW_STEPS: { value: FlowStep; label: string }[] = [
  { value: "hero", label: "Hero (welcome)" },
  { value: "questions", label: "Questions" },
  { value: "contact", label: "Contact" },
  { value: "result", label: "Result" },
];

const LAYOUT_OPTIONS: { value: AppConfig["theme"]["layout"]; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "left", label: "Left" },
  { value: "full-width", label: "Full width" },
];

const CONTACT_FIELD_TYPES: { value: ContactField["type"]; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "text", label: "Text" },
];

function slugFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function toHexColor(value: string): string {
  const hex = value.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  return "#4a6b5a";
}

function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$/.test(s) || /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s);
}

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "var(--font-sans)", label: "System default" },
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "monospace", label: "Monospace" },
  { value: "__custom__", label: "Custom…" },
];

export function ConfigFormFields({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}) {
  const [customFontMode, setCustomFontMode] = useState(false);

  function updateTheme(
    patch: Partial<AppConfig["theme"]>
  ) {
    onChange({
      ...config,
      theme: { ...config.theme, ...patch },
    });
  }

  function updateHero(
    patch: Partial<NonNullable<AppConfig["hero"]>>
  ) {
    const hero = config.hero ?? {
      title: "",
      body: [],
      ctaLabel: "Get started",
    };
    onChange({
      ...config,
      hero: { ...hero, ...patch },
    });
  }

  function setSteps(steps: FlowStep[]) {
    onChange({ ...config, steps });
  }

  function addStep() {
    const existing = config.steps;
    const next = FLOW_STEPS.find((s) => !existing.includes(s.value));
    if (next) setSteps([...existing, next.value]);
  }

  function removeStep(index: number) {
    setSteps(config.steps.filter((_, i) => i !== index));
  }

  function moveStep(index: number, dir: -1 | 1) {
    const arr = [...config.steps];
    const to = index + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[index], arr[to]] = [arr[to], arr[index]];
    setSteps(arr);
  }

  function updateContactFields(fields: ContactField[]) {
    onChange({ ...config, contactFields: fields });
  }

  function updateContactField(i: number, patch: Partial<ContactField>) {
    const next = [...config.contactFields];
    next[i] = { ...next[i], ...patch };
    if (patch.label != null && !patch.id) next[i].id = slugFromLabel(patch.label) || next[i].id;
    updateContactFields(next);
  }

  function addContactField() {
    const id = `field-${config.contactFields.length + 1}`;
    updateContactFields([
      ...config.contactFields,
      { id, type: "text", label: "" },
    ]);
  }

  function removeContactField(i: number) {
    updateContactFields(config.contactFields.filter((_, j) => j !== i));
  }

  const hero = config.hero;
  const bodyText = (hero?.body ?? []).join("\n");

  return (
    <div className="space-y-8">
      {/* Theme */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Theme</h3>
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>Primary colour</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={
                  isValidHex(config.theme.primaryColor ?? "")
                    ? toHexColor(config.theme.primaryColor!)
                    : "#4a6b5a"
                }
                onChange={(e) =>
                  updateTheme({ primaryColor: e.target.value })
                }
                className="h-10 w-14 rounded border border-zinc-600 cursor-pointer bg-transparent shrink-0"
              />
              <input
                type="text"
                value={config.theme.primaryColor ?? ""}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                placeholder="#4a6b5a"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Background</label>
            <div className="flex gap-2 items-center">
              {!(config.theme.background ?? "").startsWith("http") && (
                <input
                  type="color"
                  value={
                    config.theme.background &&
                    isValidHex(config.theme.background)
                      ? toHexColor(config.theme.background)
                      : "#0d1f18"
                  }
                  onChange={(e) =>
                    updateTheme({ background: e.target.value })
                  }
                  className="h-10 w-14 rounded border border-zinc-600 cursor-pointer bg-transparent shrink-0"
                />
              )}
              <input
                type="text"
                value={config.theme.background ?? ""}
                onChange={(e) => updateTheme({ background: e.target.value })}
                placeholder="Colour or image URL"
                className={inputClass}
              />
            </div>
            <p className={hintClass}>
              Use the colour picker for solid colours, or enter an image URL.
            </p>
          </div>
          <div>
            <label className={labelClass}>Font family</label>
            {(() => {
              const current = config.theme.fontFamily ?? "";
              const normalized = current || "var(--font-sans)";
              const matchingPreset = FONT_OPTIONS.find(
                (o) => o.value !== "__custom__" && o.value === normalized
              );
              const selectValue =
                customFontMode ? "__custom__" : (matchingPreset ? matchingPreset.value : "__custom__");
              return (
                <>
                  <select
                    value={selectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setCustomFontMode(true);
                      } else {
                        setCustomFontMode(false);
                        updateTheme({ fontFamily: v });
                      }
                    }}
                    className={inputClass}
                  >
                    {FONT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {(selectValue === "__custom__" || customFontMode) && (
                    <input
                      type="text"
                      value={current}
                      onChange={(e) =>
                        updateTheme({ fontFamily: e.target.value })
                      }
                      placeholder="e.g. var(--font-sans)"
                      className={`${inputClass} mt-2`}
                    />
                  )}
                </>
              );
            })()}
          </div>
          <div>
            <label className={labelClass}>Layout</label>
            <select
              value={config.theme.layout ?? "centered"}
              onChange={(e) =>
                updateTheme({
                  layout: e.target.value as AppConfig["theme"]["layout"],
                })
              }
              className={inputClass}
            >
              {LAYOUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Hero (welcome)</h3>
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={hero?.title ?? ""}
              onChange={(e) => updateHero({ title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea
              rows={5}
              value={bodyText}
              onChange={(e) =>
                updateHero({
                  body: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className={inputClass}
            />
            <p className={hintClass}>
              One paragraph per line (each line becomes one item in the welcome
              message).
            </p>
          </div>
          <div>
            <label className={labelClass}>CTA label (line above button)</label>
            <input
              type="text"
              value={hero?.ctaLabel ?? "Get started"}
              onChange={(e) => updateHero({ ctaLabel: e.target.value })}
              placeholder="e.g. Get started or Take these 6 questions..."
              className={inputClass}
            />
            <p className={hintClass}>
              Small line of text shown above the button.
            </p>
          </div>
          <div>
            <label className={labelClass}>Button label</label>
            <input
              type="text"
              value={hero?.buttonLabel ?? ""}
              onChange={(e) => updateHero({ buttonLabel: e.target.value || undefined })}
              placeholder="e.g. Start (leave blank to use CTA label)"
              className={inputClass}
            />
            <p className={hintClass}>
              Text on the button. If empty, the CTA label above is used.
            </p>
          </div>
          <div>
            <ImageUrlField
              label="Logo URL (optional)"
              value={hero?.logoUrl ?? ""}
              onChange={(v) => updateHero({ logoUrl: v })}
              placeholder="Paste URL or use ImageKit"
            />
          </div>
          <div>
            <ImageUrlField
              label="Image URL (optional)"
              value={hero?.imageUrl ?? ""}
              onChange={(v) => updateHero({ imageUrl: v })}
              placeholder="Paste URL or use ImageKit"
            />
          </div>
          <div>
            <label className={labelClass}>Footer text (optional)</label>
            <input
              type="text"
              value={hero?.footerText ?? ""}
              onChange={(e) => updateHero({ footerText: e.target.value || undefined })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Steps</h3>
        <p className={hintClass}>
          Order of the flow. First step is shown first.
        </p>
        <ul className="space-y-2">
          {config.steps.map((step, i) => (
            <li
              key={`${step}-${i}`}
              className="flex items-center gap-2 py-1"
            >
              <span className="flex-1 rounded bg-zinc-800 px-3 py-2 text-zinc-200 capitalize">
                {FLOW_STEPS.find((s) => s.value === step)?.label ?? step}
              </span>
              <button
                type="button"
                onClick={() => moveStep(i, -1)}
                disabled={i === 0}
                className="rounded border border-zinc-600 px-2 py-1 text-zinc-300 disabled:opacity-40"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveStep(i, 1)}
                disabled={i === config.steps.length - 1}
                className="rounded border border-zinc-600 px-2 py-1 text-zinc-300 disabled:opacity-40"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="rounded border border-red-600/50 px-2 py-1 text-red-300"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {config.steps.length < 4 && (
          <button
            type="button"
            onClick={addStep}
            className="rounded border border-zinc-600 px-3 py-2 text-zinc-300"
          >
            Add step
          </button>
        )}
      </section>

      {/* Questions */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Questions</h3>
        <div>
          <label className={labelClass}>Text question button label</label>
          <input
            type="text"
            value={config.textQuestionButtonLabel ?? ""}
            onChange={(e) =>
              onChange({
                ...config,
                textQuestionButtonLabel: e.target.value.trim() === "" ? undefined : e.target.value,
              })
            }
            placeholder="OK"
            className={inputClass}
          />
          <p className={hintClass}>
            Label for the submit button on text-answer questions. Leave blank for &quot;OK&quot;.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Contact</h3>
        <div className="grid gap-4">
          <div>
            <label className={labelClass}>Contact intro (optional)</label>
            <textarea
              rows={2}
              value={config.contactIntro ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  contactIntro: e.target.value || undefined,
                })
              }
              placeholder="Copy above the contact form"
              className={inputClass}
            />
          </div>
          <div>
            <ImageUrlField
              label="Contact image URL (optional)"
              value={config.contactImageUrl ?? ""}
              onChange={(v) =>
                onChange({
                  ...config,
                  contactImageUrl: v,
                })
              }
              placeholder="Paste URL or use ImageKit"
            />
          </div>
          <div>
            <label className={labelClass}>Default thank-you message (optional)</label>
            <textarea
              rows={2}
              value={config.defaultThankYouMessage ?? ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  defaultThankYouMessage: e.target.value || undefined,
                })
              }
              placeholder="Shown when n8n doesn’t send one"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Contact fields</label>
          <div className="space-y-3">
            {config.contactFields.map((field, i) => (
              <div
                key={field.id}
                className="rounded border border-zinc-600 bg-zinc-800/50 p-3 space-y-2"
              >
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Id (e.g. email)"
                      value={field.id}
                      onChange={(e) =>
                        updateContactField(i, { id: e.target.value })
                      }
                      className={inputClass}
                    />
                    <p className={hintClass}>Used as the form field name.</p>
                  </div>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateContactField(i, {
                        type: e.target.value as ContactField["type"],
                      })
                    }
                    className={inputClass}
                    style={{ width: "100px" }}
                  >
                    {CONTACT_FIELD_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Label"
                  value={field.label}
                  onChange={(e) =>
                    updateContactField(i, { label: e.target.value })
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Placeholder (optional)"
                  value={field.placeholder ?? ""}
                  onChange={(e) =>
                    updateContactField(i, {
                      placeholder: e.target.value || undefined,
                    })
                  }
                  className={inputClass}
                />
                <label className="flex items-center gap-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={field.required ?? false}
                    onChange={(e) =>
                      updateContactField(i, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeContactField(i)}
                  className="text-sm text-red-300"
                >
                  Remove field
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addContactField}
              className="rounded border border-zinc-600 px-3 py-2 text-zinc-300"
            >
              Add field
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
