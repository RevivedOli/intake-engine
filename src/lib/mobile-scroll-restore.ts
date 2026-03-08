"use client";

import { useRef } from "react";

const MOBILE_BREAKPOINT = 640;
const RESTORE_DELAY_MS = 350;
const SCROLL_ABOVE_KEYBOARD_DELAY_MS = 400;

export interface SavedScrollPosition {
  windowScrollY: number;
  scrollElement: HTMLElement | null;
  elementScrollTop: number;
}

/** Find the first scrollable ancestor, or null if document scrolls. */
function getScrollElement(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** Save current scroll position (window and scroll container). */
export function saveScrollPosition(focusedEl: HTMLElement): SavedScrollPosition {
  const scrollEl = getScrollElement(focusedEl);
  return {
    windowScrollY: typeof window !== "undefined" ? window.scrollY : 0,
    scrollElement: scrollEl,
    elementScrollTop: scrollEl ? scrollEl.scrollTop : 0,
  };
}

/** Restore saved scroll position after keyboard closes. */
export function restoreScrollPosition(saved: SavedScrollPosition): void {
  if (typeof window === "undefined") return;
  window.scrollTo(0, saved.windowScrollY);
  if (saved.scrollElement) {
    saved.scrollElement.scrollTop = saved.elementScrollTop;
  }
}

/** Scroll focused input above keyboard (mobile only). */
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
 * Returns handlers for mobile: save scroll on focus, scroll input above keyboard,
 * restore scroll on blur after delay.
 */
export function useMobileScrollRestore(): {
  onFocus: () => void;
  onBlur: () => void;
} {
  const savedRef = useRef<SavedScrollPosition | null>(null);
  const restoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFocus = () => {
    if (typeof window === "undefined" || window.innerWidth >= MOBILE_BREAKPOINT) return;
    const el = document.activeElement as HTMLElement | null;
    if (el) {
      savedRef.current = saveScrollPosition(el);
      scrollInputAboveKeyboard();
    }
  };

  const onBlur = () => {
    if (typeof window === "undefined" || window.innerWidth >= MOBILE_BREAKPOINT) return;
    const saved = savedRef.current;
    savedRef.current = null;
    if (saved) {
      if (restoreTimeoutRef.current) clearTimeout(restoreTimeoutRef.current);
      restoreTimeoutRef.current = setTimeout(() => {
        restoreTimeoutRef.current = null;
        restoreScrollPosition(saved);
      }, RESTORE_DELAY_MS);
    }
  };

  return { onFocus, onBlur };
}
