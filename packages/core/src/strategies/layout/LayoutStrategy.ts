import type { Range } from '../../types';

export interface LayoutStrategy {
  getItemOffset(index: number): number;

  getItemSize(index: number): number;

  getTotalSize(count: number): number;

  getVisibleRange(
    scrollOffset: number,
    viewportSize: number,
    count: number
  ): Range;
}

