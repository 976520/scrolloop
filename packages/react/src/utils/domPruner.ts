import type { TransitionStrategy } from "../types";

export const defaultTransitionStrategy: TransitionStrategy = {
  switchTrigger: "immediate",
  transitionStrategy: "replace-offscreen",
  pruneStrategy: "idle",
  chunkSize: 10,
};

const RIC = (cb: () => void) =>
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback(cb)
    : setTimeout(cb, 1);
const CIC = (id: any) =>
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? window.cancelIdleCallback(id)
    : clearTimeout(id);

export function pruneOffscreenDOMIdle(
  container: HTMLElement,
  range: { start: number; end: number },
  onPrune: (idx: number) => void
) {
  let id: any,
    cancelled = false;
  const prune = () => {
    if (cancelled) return;
    let count = 0;
    container.querySelectorAll("[data-item-index]").forEach((el) => {
      if (count++ > 5) return;
      const i = parseInt(el.getAttribute("data-item-index") || "-1", 10);
      if (i >= 0 && (i < range.start || i > range.end)) onPrune(i);
    });
    if (count > 0 && !cancelled) id = RIC(prune);
  };
  id = RIC(prune);
  return () => {
    cancelled = true;
    CIC(id);
  };
}

export function pruneOffscreenDOMChunk(
  container: HTMLElement,
  range: { start: number; end: number },
  chunk: number,
  onPrune: (idx: number) => void
) {
  let id: any,
    cancelled = false;
  const prune = () => {
    if (cancelled) return;
    const items = [...container.querySelectorAll("[data-item-index]")].filter(
      (el) => {
        const i = parseInt(el.getAttribute("data-item-index") || "-1", 10);
        return i >= 0 && (i < range.start || i > range.end);
      }
    );
    items
      .slice(0, chunk)
      .forEach((el) =>
        onPrune(parseInt(el.getAttribute("data-item-index")!, 10))
      );
    if (items.length > chunk && !cancelled) id = setTimeout(prune, 16);
  };
  id = setTimeout(prune, 16);
  return () => {
    cancelled = true;
    clearTimeout(id);
  };
}
