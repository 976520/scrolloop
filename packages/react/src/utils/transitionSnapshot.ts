import type { TransitionSnapshot } from "../types";

export function captureSnapshot(
  container: HTMLElement,
  itemSize: number,
  totalItems: number
): TransitionSnapshot {
  const scrollTop = container.scrollTop;
  const viewportHeight = container.clientHeight;
  const firstVisibleIndex = Math.floor(scrollTop / itemSize);

  const focusedElement = document.activeElement as HTMLElement | null;
  const focusedElementId =
    focusedElement?.id || focusedElement?.getAttribute("data-item-id") || null;

  const itemMeasurements = new Map<number, number>();
  const startIndex = Math.max(0, firstVisibleIndex - 5);
  const endIndex = Math.min(
    totalItems - 1,
    firstVisibleIndex + Math.ceil(viewportHeight / itemSize) + 5
  );

  for (let i = startIndex; i <= endIndex; i++) {
    const element = container.querySelector(
      `[data-item-index="${i}"]`
    ) as HTMLElement | null;
    if (element) {
      itemMeasurements.set(i, element.offsetHeight);
    }
  }

  return {
    scrollTop,
    viewportHeight,
    firstVisibleIndex,
    focusedElement,
    focusedElementId,
    itemMeasurements,
  };
}

export function restoreSnapshot(
  container: HTMLElement,
  snapshot: TransitionSnapshot
): void {
  container.scrollTop = snapshot.scrollTop;

  if (snapshot.focusedElementId && snapshot.focusedElement) {
    const targetElement =
      document.getElementById(snapshot.focusedElementId) ||
      document.querySelector(`[data-item-id="${snapshot.focusedElementId}"]`);
    if (targetElement && targetElement instanceof HTMLElement) {
      setTimeout(() => {
        targetElement.focus();
      }, 0);
    }
  }
}
