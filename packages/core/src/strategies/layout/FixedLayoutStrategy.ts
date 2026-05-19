import type { Range } from "../../types";
import type { LayoutStrategy } from "./LayoutStrategy";
import { clamp } from "../../utils/clamp";
import { getMaxElementSize } from "../../utils/getMaxElementSize";
import { mapToVirtualOffset } from "../../utils/mapToVirtualOffset";

export class FixedLayoutStrategy implements LayoutStrategy {
  readonly #itemSize: number;

  constructor(itemSize: number) {
    this.#itemSize = itemSize;
  }

  getItemOffset(index: number): number {
    return index * this.#itemSize;
  }

  getItemSize(_index: number): number {
    return this.#itemSize;
  }

  getVirtualSize(count: number): number {
    return count * this.#itemSize;
  }

  getTotalSize(count: number): number {
    return this.#clampedTotalSize(count * this.#itemSize);
  }

  getVisibleRange(
    scrollOffset: number,
    viewportSize: number,
    count: number
  ): Range {
    const virtualTotal = count * this.#itemSize;
    const clampedTotal = this.#clampedTotalSize(virtualTotal);
    const virtualOffset = mapToVirtualOffset(
      scrollOffset,
      viewportSize,
      virtualTotal,
      clampedTotal
    );

    const startIndex = clamp(
      0,
      Math.floor(virtualOffset / this.#itemSize),
      count - 1
    );
    const visibleCount = Math.ceil(viewportSize / this.#itemSize);
    const endIndex = Math.min(count - 1, startIndex + visibleCount);

    return { startIndex, endIndex };
  }

  #clampedTotalSize(virtualTotal: number): number {
    const max = getMaxElementSize();
    return virtualTotal > max ? max : virtualTotal;
  }
}
