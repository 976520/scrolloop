import type { Range } from "../../types";
import type { LayoutStrategy } from "./LayoutStrategy";
import { clamp } from "../../utils/clamp";
import { getMaxElementSize } from "../../utils/getMaxElementSize";

export class FixedLayoutStrategy implements LayoutStrategy {
  readonly #itemSize: number;
  #lastScrollOffset = 0;
  #lastViewportSize = 0;
  #lastCount = 0;

  constructor(itemSize: number) {
    this.#itemSize = itemSize;
  }

  getItemOffset(index: number): number {
    const virtualTotal = this.#lastCount * this.#itemSize;
    const clampedTotal = this.#clampedTotalSize(virtualTotal);

    if (virtualTotal <= clampedTotal) {
      return index * this.#itemSize;
    }

    const virtualOffset = this.#virtualOffset(
      this.#lastScrollOffset,
      this.#lastViewportSize,
      virtualTotal,
      clampedTotal
    );
    return this.#lastScrollOffset + (index * this.#itemSize - virtualOffset);
  }

  getItemSize(_index: number): number {
    return this.#itemSize;
  }

  getTotalSize(count: number): number {
    return this.#clampedTotalSize(count * this.#itemSize);
  }

  getVisibleRange(
    scrollOffset: number,
    viewportSize: number,
    count: number
  ): Range {
    this.#lastScrollOffset = scrollOffset;
    this.#lastViewportSize = viewportSize;
    this.#lastCount = count;

    const virtualTotal = count * this.#itemSize;
    const clampedTotal = this.#clampedTotalSize(virtualTotal);
    const virtualOffset = this.#virtualOffset(
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

  #virtualOffset(
    scrollOffset: number,
    viewportSize: number,
    virtualTotal: number,
    clampedTotal: number
  ): number {
    if (virtualTotal <= clampedTotal) return scrollOffset;
    const scrollable = clampedTotal - viewportSize;
    if (scrollable <= 0) return 0;
    const ratio = scrollOffset / scrollable;
    return ratio * (virtualTotal - viewportSize);
  }
}
