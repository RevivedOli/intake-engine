"use client";

const MOBILE_BREAKPOINT = 640;
const TEXTAREA_BREAKPOINT = 1024;
const SCROLL_ABOVE_KEYBOARD_DELAY_MS = 400;

/** Scroll focused input above keyboard (contact fields, mobile only). */
export function scrollInputAboveKeyboard(): void {
  if (typeof window === "undefined" || window.innerWidth >= MOBILE_BREAKPOINT) return;
  setTimeout(() => {
    (document.activeElement as HTMLElement)?.scrollIntoView({
      block: "end",
      behavior: "auto",
    });
  }, SCROLL_ABOVE_KEYBOARD_DELAY_MS);
}

/**
 * Minimal scroll: show input above keyboard. Skip if already visible.
 */
function scrollInputAboveKeyboardMinimal(el: HTMLElement): void {
  if (typeof window === "undefined" || window.innerWidth >= TEXTAREA_BREAKPOINT) return;
  setTimeout(() => {
    const vv = window.visualViewport;
    const rect = el.getBoundingClientRect();
    const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
    if (rect.bottom <= visibleBottom + 20) {
      return;
    }
    el.scrollIntoView({ block: "end", behavior: "auto" });
  }, SCROLL_ABOVE_KEYBOARD_DELAY_MS);
}

/**
 * Hook for text inputs (textarea, contact): on focus, scroll minimally to show input above keyboard.
 * No restore on blur to avoid page jump. Mobile and tablet (< 1024px).
 */
export function useTextareaScrollRestore(): {
  onFocus: () => void;
  onBlur: () => void;
} {
  const onFocus = () => {
    if (typeof window === "undefined" || window.innerWidth >= TEXTAREA_BREAKPOINT) return;
    const el = document.activeElement as HTMLElement | null;
    if (el) scrollInputAboveKeyboardMinimal(el);
  };

  const onBlur = () => {};

  return { onFocus, onBlur };
}

/**
 * Returns handlers for mobile: on focus, scroll input above keyboard.
 * No restore on blur to avoid page jump. Used by contact fields (< 640px).
 */
export function useMobileScrollRestore(): {
  onFocus: () => void;
  onBlur: () => void;
} {
  const onFocus = () => {
    if (typeof window === "undefined" || window.innerWidth >= MOBILE_BREAKPOINT) return;
    const el = document.activeElement as HTMLElement | null;
    if (el) scrollInputAboveKeyboard();
  };

  const onBlur = () => {};

  return { onFocus, onBlur };
}
