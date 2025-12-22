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
  const isHydratedRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const pruneCancelRef = useRef<(() => void) | null>(null);
  const transitionStrategy = { ...defaultTransitionStrategy, ...strategy };

  useEffect(() => {
    if (!enabled || isHydratedRef.current) return;

    const checkHydration = () => {
      if (containerRef.current && !isHydratedRef.current) {
        isHydratedRef.current = true;
        setState({ type: "HYDRATED" });
      }
    };

    checkHydration();

    const timeoutId = setTimeout(checkHydration, 0);

    return () => clearTimeout(timeoutId);
  }, [enabled, containerRef]);

  useEffect(() => {
    if (!enabled || state.type !== "HYDRATED") return;

    const container = containerRef.current;
    if (!container) return;

    const triggerTransition = () => {
      try {
        onTransitionStart?.();

        const snapshot = captureSnapshot(container, itemSize, totalItems);

        setState({ type: "SWITCHING", snapshot });

        restoreSnapshot(container, snapshot);

        const pruneStrategy = transitionStrategy.pruneStrategy || "idle";
        const cancelPrune =
          pruneStrategy === "chunk"
            ? pruneOffscreenDOMChunk(
                container,
                visibleRange,
                transitionStrategy.chunkSize || 10,
                () => {}
              )
            : pruneOffscreenDOMIdle(container, visibleRange, () => {});

        pruneCancelRef.current = cancelPrune;

        setTimeout(() => {
          setState({ type: "VIRTUALIZED" });
          onTransitionComplete?.();
        }, 100);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onTransitionError?.(err);

        if (transitionStrategy.transitionStrategy === "replace-offscreen") {
          setState({ type: "VIRTUALIZED" });
        }
      }
    };

    if (transitionStrategy.switchTrigger === "immediate") {
      triggerTransition();
    } else if (transitionStrategy.switchTrigger === "first-interaction") {
      const handleInteraction = () => {
        if (!hasInteractedRef.current) {
          hasInteractedRef.current = true;
          triggerTransition();
          container.removeEventListener("click", handleInteraction);
          container.removeEventListener("keydown", handleInteraction);
          container.removeEventListener("scroll", handleInteraction);
        }
      };

      container.addEventListener("click", handleInteraction, { once: true });
      container.addEventListener("keydown", handleInteraction, { once: true });
      container.addEventListener("scroll", handleInteraction, { once: true });

      return () => {
        container.removeEventListener("click", handleInteraction);
        container.removeEventListener("keydown", handleInteraction);
        container.removeEventListener("scroll", handleInteraction);
      };
    } else if (transitionStrategy.switchTrigger === "idle") {
      const handleIdle = () => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => {
            triggerTransition();
          });
        } else {
          setTimeout(triggerTransition, 1000);
        }
      };

      handleIdle();
      return;
    }

    return undefined;
  }, [
    enabled,
    state.type,
    containerRef,
    itemSize,
    totalItems,
    visibleRange,
    transitionStrategy,
    onTransitionStart,
    onTransitionComplete,
    onTransitionError,
  ]);

  useEffect(() => {
    return () => {
      if (pruneCancelRef.current) pruneCancelRef.current();
    };
  }, []);

  const isVirtualized = state.type === "VIRTUALIZED";
  const isSwitching = state.type === "SWITCHING";
  const snapshot = state.type === "SWITCHING" ? state.snapshot : null;

  return {
    state,
    isVirtualized,
    isSwitching,
    snapshot,
  };
}
