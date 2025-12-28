import type { VirtualRange } from "../types";

export function calculateVirtualRange(
  scrollOffset: number,
  viewportSize: number,
  itemSize: number,
  totalCount: number,
  overscan: number,
  prevScrollOffset?: number
): VirtualRange {
  const startIndex = Math.max(0, (scrollOffset / itemSize) | 0);
  const endIndex = Math.min(
    totalCount - 1,
    startIndex + Math.ceil(viewportSize / itemSize)
  );

  const isScrollingUp =
    prevScrollOffset !== undefined && scrollOffset < prevScrollOffset;
  const isScrollingDown =
    prevScrollOffset !== undefined && scrollOffset > prevScrollOffset;

  const overscanStart = isScrollingUp ? overscan * 1.5 : overscan;
  const overscanEnd = isScrollingDown ? overscan * 1.5 : overscan;

  const renderStart = Math.max(0, (startIndex - overscanStart) | 0);
  const renderEnd = Math.min(totalCount - 1, Math.ceil(endIndex + overscanEnd));

  return {
    startIndex,
    endIndex,
    renderStart,
    renderEnd,
  };
}
