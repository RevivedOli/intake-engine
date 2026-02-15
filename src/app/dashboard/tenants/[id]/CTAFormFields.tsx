"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { ImageUrlField } from "@/components/ImageUrlField";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

function ColorHexInput({
  value,
  onChange,
  className,
  placeholder = "#hex",
}: {
  value: string;
  onChange: (hex: string | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  const normalizedHex = (() => {
    const h = (value ?? "").replace(/^#/, "").trim();
    if (/^[0-9A-Fa-f]{6}$/.test(h)) return `#${h.toLowerCase()}`;
    if (/^[0-9A-Fa-f]{3}$/.test(h)) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    return null;
  })();
  const pickerValue = normalizedHex ?? "#808080";

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={pickerValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 rounded border border-zinc-600 cursor-pointer bg-transparent shrink-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded"
        title="Pick colour"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={className}
        placeholder={placeholder}
      />
    </div>
  );
}

const CTA_TEMPLATES: { value: CtaConfig["type"]; label: string }[] = [
  { value: "thank_you", label: "Thank you message" },
  { value: "link", label: "Link (button to URL)" },
  { value: "embed", label: "Embed video" },
  { value: "multi_choice", label: "Multi-choice (user picks an option)" },
];

const OPTION_KINDS: { value: CtaMultiChoiceOption["kind"]; label: string }[] = [
  { value: "embed_video", label: "Embed video" },
  { value: "link", label: "Link" },
  { value: "discount_code", label: "Discount code" },
  { value: "webhook_then_message", label: "Webhook + thank you message" },
];

function newOptionId(): string {
  return `opt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CTAFormFields({
  config,
  onChange,
}: {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}) {
  const cta = config.cta ?? { type: "thank_you" as const, message: "Thank you." };

  function setCta(next: CtaConfig) {
    onChange({ ...config, cta: next });
  }

  return (
    <div className="space-y-6">
      <section>
        <label className={labelClass}>CTA template</label>
        <select
          value={cta.type}
          onChange={(e) => {
            const t = e.target.value as CtaConfig["type"];
            if (t === "thank_you") setCta({ type: "thank_you", message: "Thank you." });
            else if (t === "link") setCta({ type: "link", label: "Continue", url: "#" });
            else if (t === "embed") setCta({ type: "embed", url: "" });
            else if (t === "multi_choice")
              setCta({
                type: "multi_choice",
                prompt: "",
                options: [{ id: newOptionId(), label: "Option 1", kind: "embed_video", variant: "direct", videoUrl: "" }],
              });
          }}
          className={inputClass}
        >
          {CTA_TEMPLATES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      {cta.type === "thank_you" && (
        <section>
          <label className={labelClass}>Message</label>
          <textarea
            value={cta.message ?? ""}
            onChange={(e) => setCta({ ...cta, message: e.target.value })}
            className={inputClass}
            rows={3}
            placeholder="Thank you for submitting."
          />
        </section>
      )}

      {cta.type === "link" && (
        <>
          <section>
            <label className={labelClass}>Button label</label>
            <input
              type="text"
              value={cta.label}
              onChange={(e) => setCta({ ...cta, label: e.target.value })}
              className={inputClass}
              placeholder="Book a call"
            />
          </section>
          <section>
            <label className={labelClass}>URL</label>
            <input
              type="url"
              value={cta.url}
              onChange={(e) => setCta({ ...cta, url: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </section>
          <section className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cta-link-newtab"
              checked={cta.openInNewTab ?? false}
              onChange={(e) => setCta({ ...cta, openInNewTab: e.target.checked })}
              className="rounded border-zinc-600 bg-zinc-800"
            />
            <label htmlFor="cta-link-newtab" className="text-sm text-zinc-300">
              Open in new tab
            </label>
          </section>
        </>
      )}

      {cta.type === "embed" && (
        <>
          <section>
            <label className={labelClass}>Title (optional, above video)</label>
            <input
              type="text"
              value={cta.title ?? ""}
              onChange={(e) => setCta({ ...cta, title: e.target.value || undefined })}
              className={inputClass}
              placeholder="e.g. Watch the video"
            />
          </section>
          <section>
            <label className={labelClass}>Subheader (optional, above video)</label>
            <input
              type="text"
              value={cta.subtitle ?? ""}
              onChange={(e) => setCta({ ...cta, subtitle: e.target.value || undefined })}
              className={inputClass}
            />
          </section>
          <section>
            <label className={labelClass}>Video URL (embed)</label>
            <input
              type="url"
              value={cta.url}
              onChange={(e) => setCta({ ...cta, url: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </section>
          <section>
            <label className={labelClass}>Text below video (optional)</label>
            <textarea
              value={cta.textBelow ?? ""}
              onChange={(e) => setCta({ ...cta, textBelow: e.target.value || undefined })}
              className={inputClass}
              rows={2}
            />
          </section>
          <section>
            <label className={labelClass}>Button under video (optional)</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="text-xs text-zinc-500">Button name</label>
                <input
                  type="text"
                  value={cta.button?.label ?? ""}
                  onChange={(e) =>
                    setCta({
                      ...cta,
                      button: cta.button ? { ...cta.button, label: e.target.value } : { label: e.target.value, url: "" },
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. Learn more"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Button URL</label>
                <input
                  type="url"
                  value={cta.button?.url ?? ""}
                  onChange={(e) =>
                    setCta({
                      ...cta,
                      button: cta.button ? { ...cta.button, url: e.target.value } : { label: "", url: e.target.value },
                    })
                  }
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Button colour</label>
                <ColorHexInput
                  value={cta.button?.color ?? ""}
                  onChange={(v) =>
                    setCta({
                      ...cta,
                      button: cta.button ? { ...cta.button, color: v || undefined } : undefined,
                    })
                  }
                  className={inputClass}
                  placeholder="e.g. #a47f4c"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {cta.type === "multi_choice" && (
        <MultiChoiceFields cta={cta} setCta={setCta} />
      )}
    </div>
  );
}

function MultiChoiceFields({
  cta,
  setCta,
}: {
  cta: Extract<CtaConfig, { type: "multi_choice" }>;
  setCta: (c: CtaConfig) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <label className={labelClass}>Title (optional)</label>
        <input
          type="text"
          value={cta.title ?? ""}
          onChange={(e) => setCta({ ...cta, title: e.target.value.trim() === "" ? undefined : e.target.value })}
          className={inputClass}
          placeholder="e.g. What would you like to do next?"
        />
        <p className="text-xs text-zinc-500 mt-1">Shown at the top of the CTA page.</p>
      </section>
      <section>
        <label className={labelClass}>Sub-heading (optional)</label>
        <input
          type="text"
          value={cta.subheading ?? ""}
          onChange={(e) => setCta({ ...cta, subheading: e.target.value.trim() === "" ? undefined : e.target.value })}
          className={inputClass}
          placeholder="e.g. We've got your details — pick an option below"
        />
      </section>
      <section>
        <ImageUrlField
          label="Image above options (optional)"
          value={cta.imageUrl ?? ""}
          onChange={(v) => setCta({ ...cta, imageUrl: v || undefined })}
          placeholder="Paste image URL or use ImageKit"
        />
      </section>
      <section>
        <label className={labelClass}>Prompt (above options)</label>
        <input
          type="text"
          value={cta.prompt ?? ""}
          onChange={(e) => setCta({ ...cta, prompt: e.target.value || undefined })}
          className={inputClass}
          placeholder="Choose one:"
        />
      </section>
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Options</label>
          <button
            type="button"
            onClick={() => {
              const opt: CtaMultiChoiceOptionVideoDirect = {
                id: newOptionId(),
                label: `Option ${cta.options.length + 1}`,
                kind: "embed_video",
                variant: "direct",
                videoUrl: "",
              };
              setCta({ ...cta, options: [...cta.options, opt] });
            }}
            className="text-sm px-2 py-1 rounded bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
          >
            Add option
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-2">
          Drag the handle to reorder. Order here is the order shown to users.
        </p>
        <OptionsSortableList cta={cta} setCta={setCta} />
      </section>
    </div>
  );
}

function OptionsSortableList({
  cta,
  setCta,
}: {
  cta: Extract<CtaConfig, { type: "multi_choice" }>;
  setCta: (c: CtaConfig) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Enter"], end: ["Enter", "Tab"], cancel: ["Escape"] },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cta.options.findIndex((o) => o.id === active.id);
    const newIndex = cta.options.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setCta({ ...cta, options: arrayMove(cta.options, oldIndex, newIndex) });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={cta.options.map((o) => o.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-4 list-none pl-0">
          {cta.options.map((option, index) => (
            <li key={option.id}>
              <SortableOptionCard
                option={option}
                index={index}
                onUpdate={(next) => {
                  const opts = [...cta.options];
                  opts[index] = next;
                  setCta({ ...cta, options: opts });
                }}
                onRemove={() => {
                  if (cta.options.length <= 1) return;
                  setCta({ ...cta, options: cta.options.filter((_, i) => i !== index) });
                }}
                canRemove={cta.options.length > 1}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableOptionCard({
  option,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  option: CtaMultiChoiceOption;
  index: number;
  onUpdate: (opt: CtaMultiChoiceOption) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-4 space-y-3 ${
        isDragging ? "opacity-50 border-amber-500 bg-zinc-800/80" : "border-zinc-600 bg-zinc-800/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-zinc-500 p-1 rounded hover:bg-zinc-700"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 6a1 1 0 011 1v1a1 1 0 11-2 0V9a1 1 0 011-1zm0 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6-12a1 1 0 01.967.744L14.146 7.2 17 5.34 18.18 4.12a1 1 0 011.41 1.41l-1.82 1.82a1 1 0 01-.744.967L14 7.146V9a1 1 0 11-2 0V6.854l-1.012.252a1 1 0 01-.967-.744L10.82 4.12a1 1 0 011.41-1.41l1.82 1.82a1 1 0 01.744.967L14 5.854V4a1 1 0 011-1z" />
          </svg>
        </button>
        <span className="text-zinc-500 text-sm">#{index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>
      <OptionEditor
        option={option}
        index={index}
        onUpdate={onUpdate}
        onRemove={onRemove}
        canRemove={canRemove}
        hideHeader
      />
    </div>
  );
}

function OptionEditor({
  option,
  index,
  onUpdate,
  onRemove,
  canRemove,
  hideHeader,
}: {
  option: CtaMultiChoiceOption;
  index: number;
  onUpdate: (opt: CtaMultiChoiceOption) => void;
  onRemove: () => void;
  canRemove: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className="space-y-3">
      {hideHeader ? null : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-500">Option {index + 1}</span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div>
        <label className={labelClass}>Label (what the user sees)</label>
        <input
          type="text"
          value={option.label}
          onChange={(e) => onUpdate({ ...option, label: e.target.value })}
          className={inputClass}
          placeholder="e.g. Watch the video"
        />
      </div>
      <div>
        <label className={labelClass}>Action type</label>
        <select
          value={option.kind}
          onChange={(e) => {
            const k = e.target.value as CtaMultiChoiceOption["kind"];
            if (k === "embed_video")
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "embed_video",
                variant: "direct",
                videoUrl: "",
              });
            else if (k === "discount_code")
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "discount_code",
                title: "",
                linkUrl: "",
                code: "",
              });
            else if (k === "link")
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "link",
                url: "#",
              });
            else if (k === "webhook_then_message")
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "webhook_then_message",
                webhookTag: "signup",
                thankYouMessage: "Thank you. We'll be in touch.",
              });
          }}
          className={inputClass}
        >
          {OPTION_KINDS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {option.kind === "embed_video" && (
        <EmbedVideoOptionFields
          option={option}
          onUpdate={(next) => onUpdate(next as CtaMultiChoiceOption)}
        />
      )}
      {option.kind === "link" && (
        <LinkOptionFields
          option={option}
          onUpdate={(next) => onUpdate(next)}
        />
      )}
      {option.kind === "discount_code" && (
        <DiscountOptionFields
          option={option}
          onUpdate={(next) => onUpdate(next)}
        />
      )}
      {option.kind === "webhook_then_message" && (
        <WebhookOptionFields
          option={option}
          onUpdate={(next) => onUpdate(next)}
        />
      )}
    </div>
  );
}

function EmbedVideoOptionFields({
  option,
  onUpdate,
}: {
  option: CtaMultiChoiceOptionVideoDirect | CtaMultiChoiceOptionVideoSubChoice;
  onUpdate: (o: CtaMultiChoiceOptionVideoDirect | CtaMultiChoiceOptionVideoSubChoice) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-zinc-600">
      <div>
        <label className={labelClass}>Variant</label>
        <select
          value={option.variant}
          onChange={(e) => {
            const v = e.target.value as "direct" | "sub_choice";
            if (v === "direct")
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "embed_video",
                variant: "direct",
                videoUrl: option.variant === "direct" ? option.videoUrl : "",
                title: option.variant === "direct" ? option.title : undefined,
                subtitle: option.variant === "direct" ? option.subtitle : undefined,
                button: option.variant === "direct" ? option.button : undefined,
              });
            else
              onUpdate({
                id: option.id,
                label: option.label,
                kind: "embed_video",
                variant: "sub_choice",
                title: option.variant === "sub_choice" ? option.title : undefined,
                subheading: option.variant === "sub_choice" ? option.subheading : undefined,
                prompt: option.variant === "sub_choice" ? option.prompt : undefined,
                imageUrl: option.variant === "sub_choice" ? option.imageUrl : undefined,
                choices: option.variant === "sub_choice" ? option.choices : [{ label: "Choice 1", videoUrl: "" }],
              });
          }}
          className={inputClass}
        >
          <option value="direct">Single video URL</option>
          <option value="sub_choice">Sub-choices (e.g. category then video)</option>
        </select>
      </div>
      {option.variant === "sub_choice" && (
        <>
          <div>
            <label className={labelClass}>Title on this step (optional)</label>
            <input
              type="text"
              value={option.title ?? ""}
              onChange={(e) => onUpdate({ ...option, title: e.target.value === "" ? undefined : e.target.value })}
              className={inputClass}
              placeholder="Leave blank for no title"
            />
          </div>
          <div>
            <label className={labelClass}>Sub-heading on this step (optional)</label>
            <input
              type="text"
              value={option.subheading ?? ""}
              onChange={(e) => onUpdate({ ...option, subheading: e.target.value === "" ? undefined : e.target.value })}
              className={inputClass}
              placeholder="Leave blank for no sub-heading"
            />
          </div>
          <div>
            <label className={labelClass}>Prompt above sub-choices (optional)</label>
            <input
              type="text"
              value={option.prompt ?? ""}
              onChange={(e) => onUpdate({ ...option, prompt: e.target.value || undefined })}
              className={inputClass}
              placeholder="e.g. Pick a topic: (leave empty to use main CTA prompt)"
            />
          </div>
          <ImageUrlField
            label="Image above sub-choices (optional)"
            value={option.imageUrl ?? ""}
            onChange={(v) => onUpdate({ ...option, imageUrl: v || undefined })}
            placeholder="Leave blank for no image"
          />
        </>
      )}
      {option.variant === "direct" && (
        <>
          <div>
            <label className={labelClass}>Video URL</label>
            <input
              type="url"
              value={option.videoUrl}
              onChange={(e) => onUpdate({ ...option, videoUrl: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Title above video (optional)</label>
            <input
              type="text"
              value={option.title ?? ""}
              onChange={(e) => onUpdate({ ...option, title: e.target.value || undefined })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Subheader above video (optional)</label>
            <input
              type="text"
              value={option.subtitle ?? ""}
              onChange={(e) => onUpdate({ ...option, subtitle: e.target.value || undefined })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Button under video (optional)</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={option.button?.label ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...option,
                    button: option.button ? { ...option.button, label: e.target.value } : { label: e.target.value, url: "" },
                  })
                }
                className={inputClass}
                placeholder="Button name"
              />
              <input
                type="url"
                value={option.button?.url ?? ""}
                onChange={(e) =>
                  onUpdate({
                    ...option,
                    button: option.button ? { ...option.button, url: e.target.value } : { label: "", url: e.target.value },
                  })
                }
                className={inputClass}
                placeholder="Button URL"
              />
              <ColorHexInput
                value={option.button?.color ?? ""}
                onChange={(v) =>
                  onUpdate({
                    ...option,
                    button: option.button ? { ...option.button, color: v || undefined } : undefined,
                  })
                }
                className={inputClass}
                placeholder="Colour #hex"
              />
            </div>
          </div>
        </>
      )}
      {option.variant === "sub_choice" && (
        <SubChoiceSortableList option={option} onUpdate={onUpdate} />
      )}
    </div>
  );
}

type SubChoiceItem = CtaMultiChoiceOptionVideoSubChoice["choices"][number];

function SubChoiceSortableList({
  option,
  onUpdate,
}: {
  option: CtaMultiChoiceOptionVideoSubChoice;
  onUpdate: (o: CtaMultiChoiceOptionVideoSubChoice) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Enter"], end: ["Enter", "Tab"], cancel: ["Escape"] },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = Number(active.id);
    const newIndex = Number(over.id);
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
    const choices = arrayMove(option.choices, oldIndex, newIndex);
    onUpdate({ ...option, choices });
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>Choices (label + video URL; optional title, subheader, button per choice)</label>
      <p className="text-xs text-zinc-500 mb-1">Drag the handle to reorder.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={option.choices.map((_, i) => i)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2 list-none pl-0">
            {option.choices.map((choice, i) => (
              <li key={i}>
                <SortableSubChoiceCard
                  choice={choice}
                  index={i}
                  option={option}
                  onUpdate={onUpdate}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() =>
          onUpdate({
            ...option,
            choices: [...option.choices, { label: `Choice ${option.choices.length + 1}`, videoUrl: "" }],
          })
        }
        className="text-sm px-2 py-1 rounded bg-zinc-700 text-zinc-400 hover:text-zinc-200"
      >
        Add choice
      </button>
    </div>
  );
}

function SortableSubChoiceCard({
  choice,
  index,
  option,
  onUpdate,
}: {
  choice: SubChoiceItem;
  index: number;
  option: CtaMultiChoiceOptionVideoSubChoice;
  onUpdate: (o: CtaMultiChoiceOptionVideoSubChoice) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateChoice = (patch: Partial<SubChoiceItem>) => {
    const c = [...option.choices];
    c[index] = { ...c[index], ...patch };
    onUpdate({ ...option, choices: c });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded border space-y-2 ${
        isDragging ? "opacity-50 border-amber-500 bg-zinc-800/80" : "border-zinc-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="touch-none cursor-grab active:cursor-grabbing text-zinc-500 p-1 rounded hover:bg-zinc-700 shrink-0"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 6a1 1 0 011 1v1a1 1 0 11-2 0V9a1 1 0 011-1zm0 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6-12a1 1 0 01.967.744L14.146 7.2 17 5.34 18.18 4.12a1 1 0 011.41 1.41l-1.82 1.82a1 1 0 01-.744.967L14 7.146V9a1 1 0 11-2 0V6.854l-1.012.252a1 1 0 01-.967-.744L10.82 4.12a1 1 0 011.41-1.41l1.82 1.82a1 1 0 01.744.967L14 5.854V4a1 1 0 011-1z" />
          </svg>
        </button>
        <span className="text-zinc-500 text-xs shrink-0">#{index + 1}</span>
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={choice.label}
            onChange={(e) => updateChoice({ label: e.target.value })}
            className={`${inputClass} flex-1`}
            placeholder="Choice label"
          />
          <input
            type="url"
            value={choice.videoUrl}
            onChange={(e) => updateChoice({ videoUrl: e.target.value })}
            className={`${inputClass} flex-1`}
            placeholder="Video URL"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-sm">
        <input
          type="text"
          value={choice.title ?? ""}
          onChange={(e) => updateChoice({ title: e.target.value || undefined })}
          className={inputClass}
          placeholder="Title (optional)"
        />
        <input
          type="text"
          value={choice.subtitle ?? ""}
          onChange={(e) => updateChoice({ subtitle: e.target.value || undefined })}
          className={inputClass}
          placeholder="Subheader (optional)"
        />
        <input
          type="text"
          value={choice.button?.label ?? ""}
          onChange={(e) =>
            updateChoice({
              button: choice.button ? { ...choice.button, label: e.target.value } : { label: e.target.value, url: "" },
            })
          }
          className={inputClass}
          placeholder="Button name"
        />
        <input
          type="url"
          value={choice.button?.url ?? ""}
          onChange={(e) =>
            updateChoice({
              button: choice.button ? { ...choice.button, url: e.target.value } : { label: "", url: e.target.value },
            })
          }
          className={inputClass}
          placeholder="Button URL"
        />
        <ColorHexInput
          value={choice.button?.color ?? ""}
          onChange={(v) =>
            updateChoice({
              button: choice.button ? { ...choice.button, color: v || undefined } : undefined,
            })
          }
          className={inputClass}
          placeholder="Button colour #hex"
        />
      </div>
    </div>
  );
}

function LinkOptionFields({
  option,
  onUpdate,
}: {
  option: CtaMultiChoiceOptionLink;
  onUpdate: (o: CtaMultiChoiceOptionLink) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-zinc-600">
      <p className="text-xs text-zinc-500">
        Clicking this option will go straight to the URL (no extra button page).
      </p>
      <div>
        <label className={labelClass}>URL</label>
        <input
          type="url"
          value={option.url}
          onChange={(e) => onUpdate({ ...option, url: e.target.value })}
          className={inputClass}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`link-newtab-${option.id}`}
          checked={option.openInNewTab ?? false}
          onChange={(e) => onUpdate({ ...option, openInNewTab: e.target.checked })}
          className="rounded border-zinc-600 bg-zinc-800"
        />
        <label htmlFor={`link-newtab-${option.id}`} className="text-sm text-zinc-300">
          Open in new tab
        </label>
      </div>
    </div>
  );
}

function DiscountOptionFields({
  option,
  onUpdate,
}: {
  option: CtaMultiChoiceOptionDiscount;
  onUpdate: (o: CtaMultiChoiceOptionDiscount) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-zinc-600">
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={option.title}
          onChange={(e) => onUpdate({ ...option, title: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={option.description ?? ""}
          onChange={(e) => onUpdate({ ...option, description: e.target.value || undefined })}
          className={inputClass}
          rows={2}
        />
      </div>
      <div>
        <label className={labelClass}>Link URL</label>
        <input
          type="url"
          value={option.linkUrl}
          onChange={(e) => onUpdate({ ...option, linkUrl: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Link button label</label>
        <input
          type="text"
          value={option.linkLabel ?? ""}
          onChange={(e) => onUpdate({ ...option, linkLabel: e.target.value || undefined })}
          className={inputClass}
          placeholder="Get offer"
        />
      </div>
      <div>
        <label className={labelClass}>Discount code</label>
        <input
          type="text"
          value={option.code}
          onChange={(e) => onUpdate({ ...option, code: e.target.value })}
          className={inputClass}
          placeholder="SAVE20"
        />
      </div>
    </div>
  );
}

function WebhookOptionFields({
  option,
  onUpdate,
}: {
  option: CtaMultiChoiceOptionWebhook;
  onUpdate: (o: CtaMultiChoiceOptionWebhook) => void;
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-zinc-600">
      <div>
        <label className={labelClass}>Webhook tag (sent in payload so n8n can branch)</label>
        <input
          type="text"
          value={option.webhookTag}
          onChange={(e) => onUpdate({ ...option, webhookTag: e.target.value })}
          className={inputClass}
          placeholder="e.g. free_training"
        />
      </div>
      <div>
        <label className={labelClass}>Header (optional)</label>
        <input
          type="text"
          value={option.thankYouHeader ?? ""}
          onChange={(e) => onUpdate({ ...option, thankYouHeader: e.target.value.trim() || undefined })}
          className={inputClass}
          placeholder="e.g. Thank you."
        />
      </div>
      <div>
        <label className={labelClass}>Sub-heading (optional)</label>
        <input
          type="text"
          value={option.thankYouSubheading ?? ""}
          onChange={(e) => onUpdate({ ...option, thankYouSubheading: e.target.value.trim() || undefined })}
          className={inputClass}
          placeholder="e.g. We'll be in touch soon."
        />
      </div>
      <div>
        <label className={labelClass}>Thank you message (after sending)</label>
        <textarea
          value={option.thankYouMessage}
          onChange={(e) => onUpdate({ ...option, thankYouMessage: e.target.value })}
          className={inputClass}
          rows={2}
          placeholder="Main body text shown below header and sub-heading"
        />
      </div>
      <div>
        <label className={labelClass}>Webhook URL override (optional)</label>
        <input
          type="url"
          value={option.webhookUrl ?? ""}
          onChange={(e) => onUpdate({ ...option, webhookUrl: e.target.value || undefined })}
          className={inputClass}
          placeholder="Leave empty to use default"
        />
      </div>
    </div>
  );
}
