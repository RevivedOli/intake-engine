"use client";

import { useState, useEffect } from "react";
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
import type { Question, QuestionType } from "@/types/question";
import { ImageUrlField } from "@/components/ImageUrlField";

const inputClass =
  "w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-white";
const labelClass = "block text-sm font-medium text-zinc-300 mb-1";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "single", label: "Single choice" },
  { value: "multi", label: "Multiple choice" },
  { value: "text", label: "Text (free input)" },
];

function nextQuestionId(questions: Question[]): string {
  const max = questions.reduce((m, q) => {
    const match = q.id.match(/^q(\d+)$/);
    const n = match ? parseInt(match[1], 10) : 0;
    return Math.max(m, n);
  }, 0);
  return `q${max + 1}`;
}

function SortableQuestionCard({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: Question;
  index: number;
  onUpdate: (patch: Partial<Question>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasOptions = question.type === "single" || question.type === "multi";
  const options = question.options ?? [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded border bg-zinc-800/50 p-4 space-y-3 ${
        isDragging ? "opacity-50 border-amber-500" : "border-zinc-600"
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
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-sm text-red-300 hover:underline"
        >
          Remove question
        </button>
      </div>

      <div>
        <label className={labelClass}>Type</label>
        <select
          value={question.type}
          onChange={(e) =>
            onUpdate({
              type: e.target.value as QuestionType,
              options: (e.target.value === "single" || e.target.value === "multi") ? (question.options ?? []) : undefined,
            })
          }
          className={inputClass}
        >
          {QUESTION_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Question text</label>
        <textarea
          rows={2}
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="e.g. What best describes you?"
          className={inputClass}
        />
      </div>

      {hasOptions && (
        <div>
          <label className={labelClass}>Options (one per line)</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    onUpdate({ options: next });
                  }}
                  className={inputClass}
                  placeholder={`Option ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = options.filter((_, j) => j !== i);
                    onUpdate({ options: next });
                  }}
                  className="rounded border border-zinc-600 px-2 text-zinc-400 shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onUpdate({ options: [...options, ""] })}
              className="rounded border border-zinc-600 px-3 py-2 text-zinc-300 text-sm"
            >
              Add option
            </button>
          </div>
        </div>
      )}

      <div>
        <ImageUrlField
          label="Image URL (optional)"
          value={question.imageUrl ?? ""}
          onChange={(v) => onUpdate({ imageUrl: v })}
          placeholder="Paste URL or use ImageKit"
        />
      </div>

      {question.type === "text" && (
        <div>
          <label className={labelClass}>Button label (optional)</label>
          <input
            type="text"
            value={question.submitButtonLabel ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onUpdate({
                submitButtonLabel: v.trim() === "" ? undefined : v,
              });
            }}
            placeholder="e.g. OK, Next, Submit"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 mt-1">
            Label for the submit button. Leave blank to use the default from Config.
          </p>
        </div>
      )}
    </div>
  );
}

export function QuestionsFormFields({
  questions,
  onChange,
}: {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(questions, oldIndex, newIndex));
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    const next = [...questions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function addQuestion() {
    const id = nextQuestionId(questions);
    onChange([
      ...questions,
      { id, type: "single", question: "", options: [] },
    ]);
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
    null
  );
  const pendingQuestion =
    pendingRemoveIndex != null ? questions[pendingRemoveIndex] : null;

  useEffect(() => {
    if (pendingRemoveIndex == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingRemoveIndex(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pendingRemoveIndex]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Order here is the order shown to users. Drag the handle to reorder.
      </p>
      {pendingQuestion != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={(e) => e.target === e.currentTarget && setPendingRemoveIndex(null)}
        >
          <div
            className="rounded-lg border border-zinc-600 bg-zinc-800 p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-delete-title"
              className="text-lg font-medium text-zinc-200 mb-2"
            >
              Delete question?
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
              Are you sure you want to delete this question? This cannot be
              undone.
            </p>
            {pendingQuestion.question?.trim() && (
              <p className="text-zinc-500 text-sm mb-4 truncate" title={pendingQuestion.question}>
                &ldquo;{pendingQuestion.question}&rdquo;
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingRemoveIndex(null)}
                className="px-4 py-2 rounded border border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingRemoveIndex != null) {
                    removeQuestion(pendingRemoveIndex);
                    setPendingRemoveIndex(null);
                  }
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id}>
                <SortableQuestionCard
                  question={q}
                  index={i}
                  onUpdate={(patch) => updateQuestion(i, patch)}
                  onRemove={() => setPendingRemoveIndex(i)}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={addQuestion}
        className="rounded border border-zinc-600 px-4 py-2 text-zinc-300"
      >
        Add question
      </button>
    </div>
  );
}
