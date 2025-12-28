import { useEffect, useState, useRef } from "react";
import {
  pruneOffscreenDOMIdle,
  pruneOffscreenDOMChunk,
  defaultTransitionStrategy,
} from "../utils/domPruner";
import type { TransitionState, TransitionStrategy } from "../types";
import { captureSnapshot, restoreSnapshot } from "../utils/transitionSnapshot";

interface useTransitionOptions {
  enabled: boolean;
  containerRef: React.RefObject<HTMLElement>;
  itemSize: number;
  totalItems: number;
  visibleRange: { start: number; end: number };
  strategy?: TransitionStrategy;
  onTransitionStart?: () => void;
  onTransitionComplete?: () => void;
  onTransitionError?: (error: Error) => void;
}

export function useTransition({
  enabled,
  containerRef,
  itemSize,
  totalItems,
  visibleRange,
  strategy = defaultTransitionStrategy,
  onTransitionStart,
  onTransitionComplete,
  onTransitionError,
}: useTransitionOptions) {
  const [state, setState] = useState<TransitionState>({ type: "SSR_DOM" });
  const isH = useRef(false);
  const hasI = useRef(false);
  const pC = useRef<(() => void) | null>(null);
  const s = { ...defaultTransitionStrategy, ...strategy };

  useEffect(() => {
    if (!enabled || isH.current) return;
    const h = () => {
      if (containerRef.current && !isH.current) {
        isH.current = true;
        setState({ type: "HYDRATED" });
      }
    };
    h();
    const t = setTimeout(h, 0);
    return () => clearTimeout(t);
  }, [enabled, containerRef]);

  useEffect(() => {
    if (!enabled || state.type !== "HYDRATED") return;
    const c = containerRef.current;
    if (!c) return;

    const run = () => {
      try {
        onTransitionStart?.();
        const sn = captureSnapshot(c, itemSize, totalItems);
        setState({ type: "SWITCHING", snapshot: sn });
        restoreSnapshot(c, sn);
        pC.current =
          s.pruneStrategy === "chunk"
            ? pruneOffscreenDOMChunk(
                c,
                visibleRange,
                s.chunkSize || 10,
                () => {}
              )
            : pruneOffscreenDOMIdle(c, visibleRange, () => {});
        setTimeout(() => {
          setState({ type: "VIRTUALIZED" });
          onTransitionComplete?.();
        }, 100);
      } catch (e) {
        onTransitionError?.(e instanceof Error ? e : new Error(String(e)));
        if (s.transitionStrategy === "replace-offscreen")
          setState({ type: "VIRTUALIZED" });
      }
    };

    if (s.switchTrigger === "immediate") run();
    else if (s.switchTrigger === "first-interaction") {
      const i = () => {
        if (!hasI.current) {
          hasI.current = true;
          run();
          ["click", "keydown", "scroll"].forEach((ev) =>
            c.removeEventListener(ev, i)
          );
        }
      };
      ["click", "keydown", "scroll"].forEach((ev) =>
        c.addEventListener(ev, i, { once: true })
      );
      return () =>
        ["click", "keydown", "scroll"].forEach((ev) =>
          c.removeEventListener(ev, i)
        );
    } else if (s.switchTrigger === "idle") {
      "requestIdleCallback" in window
        ? window.requestIdleCallback(run)
        : setTimeout(run, 1000);
    }
    return undefined;
  }, [
    enabled,
    state.type,
    containerRef,
    itemSize,
    totalItems,
    visibleRange,
    s,
    onTransitionStart,
    onTransitionComplete,
    onTransitionError,
  ]);

  useEffect(() => () => pC.current?.(), []);

  return {
    state,
    isVirtualized: state.type === "VIRTUALIZED",
    isSwitching: state.type === "SWITCHING",
    snapshot: state.type === "SWITCHING" ? state.snapshot : null,
  };
}
