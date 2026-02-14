"use client";

import type { AppConfig } from "@/types/config";
import type { ContactField } from "@/types/contact";
import { ImageUrlField } from "@/components/ImageUrlField";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";
const hintClass = "text-xs text-zinc-500 mt-1";

const CONTACT_FIELD_TYPES: { value: ContactField["type"]; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "instagram", label: "Instagram" },
  { value: "text", label: "Text" },
];

function slugFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function ContactFormFields({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}) {
  function updateContactFields(fields: ContactField[]) {
    onChange({ ...config, contactFields: fields });
  }

  function updateContactField(i: number, patch: Partial<ContactField>) {
    const next = [...config.contactFields];
    next[i] = { ...next[i], ...patch };
    if (patch.label != null && patch.id == null) next[i].id = slugFromLabel(patch.label) || next[i].id;
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

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-200">Contact step</h3>
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
              placeholder="Shown when n8n doesn't send one"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass}>Contact fields</label>
          <div className="space-y-3">
            {config.contactFields.map((field, i) => (
              <div
                key={i}
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
