import type { Range } from "../../types";
import type { LayoutStrategy } from "./LayoutStrategy";
import { clamp } from "../../utils/clamp";

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

  getTotalSize(count: number): number {
    return count * this.#itemSize;
  }

  getVisibleRange(
    scrollOffset: number,
    viewportSize: number,
    count: number
  ): Range {
    const startIndex = clamp(
      0,
      Math.floor(scrollOffset / this.#itemSize),
      count - 1
    );

    const visibleCount = Math.ceil(viewportSize / this.#itemSize);
    const endIndex = Math.min(count - 1, startIndex + visibleCount);

    return { startIndex, endIndex };
  }
}
