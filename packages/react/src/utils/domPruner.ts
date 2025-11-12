import type { TransitionStrategy } from "../types";

export const defaultTransitionStrategy: TransitionStrategy = {
  switchTrigger: "immediate",
  transitionStrategy: "replace-offscreen",
  pruneStrategy: "idle",
  chunkSize: 10,
};

export function pruneOffscreenDOMIdle(
  container: HTMLElement,
  visibleRange: { start: number; end: number },
  onPrune: (index: number) => void
): () => void {
  let cancelled = false;
  let requestId: ReturnType<typeof requestIdleCallback> | null = null;

  const pruneChunk = () => {
    if (cancelled) return;

    const items = container.querySelectorAll("[data-item-index]");
    let pruned = 0;
    const maxPrunePerFrame = 5;

    for (const item of items) {
      if (pruned >= maxPrunePerFrame) break;

      const index = parseInt(item.getAttribute("data-item-index") || "-1", 10);
      if (index < 0) continue;

      if (index < visibleRange.start || index > visibleRange.end) {
        onPrune(index);
        pruned++;
      }
    }

    if (pruned > 0 && !cancelled) {
      requestId = requestIdleCallback(pruneChunk);
    }
  };

  requestId = requestIdleCallback(pruneChunk);

  return () => {
    cancelled = true;
    if (requestId !== null) {
      cancelIdleCallback(requestId);
    }
  };
}

export function pruneOffscreenDOMChunk(
  container: HTMLElement,
  visibleRange: { start: number; end: number },
  chunkSize: number,
  onPrune: (index: number) => void
): () => void {
  let cancelled = false;
  let timeoutId: number | null = null;

  const pruneChunk = () => {
    if (cancelled) return;

    const items = Array.from(container.querySelectorAll("[data-item-index]"));
    const offscreenItems = items.filter((item) => {
      const index = parseInt(item.getAttribute("data-item-index") || "-1", 10);
      return (
        index >= 0 && (index < visibleRange.start || index > visibleRange.end)
      );
    });

    const chunk = offscreenItems.slice(0, chunkSize);
    chunk.forEach((item) => {
      const index = parseInt(item.getAttribute("data-item-index") || "-1", 10);
      if (index >= 0) {
        onPrune(index);
      }
    });

    if (offscreenItems.length > chunkSize && !cancelled) {
      timeoutId = window.setTimeout(pruneChunk, 16) as unknown as number;
    }
  };

  timeoutId = window.setTimeout(pruneChunk, 16) as unknown as number;

  return () => {
    cancelled = true;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId as any);
    }
  };
}

function requestIdleCallback(callback: () => void): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return (window as any).requestIdleCallback(callback) as number;
  }
  return setTimeout(callback, 1) as unknown as number;
}

function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id as any);
  }
}
