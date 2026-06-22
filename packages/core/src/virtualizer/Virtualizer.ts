import type {
  VirtualItem,
  VirtualizerState,
  VirtualizerOptions,
} from "../types";
import type { LayoutStrategy } from "../strategies/layout/LayoutStrategy";
import type { ScrollSource } from "../strategies/scroll/ScrollSource";
import type { Plugin } from "../plugins/Plugin";
import { mapToVirtualOffset } from "../utils/mapToVirtualOffset";

export class Virtualizer {
  #count: number;
  readonly #overscan: number;
  #plugins: Plugin[];
  readonly #onChange: ((state: VirtualizerState) => void) | undefined;

  readonly #layoutStrategy: LayoutStrategy;
  readonly #scrollSource: ScrollSource;

  #state: VirtualizerState;
  readonly #unsubscribe: (() => void) | undefined;

  #prevRenderRange: { startIndex: number; endIndex: number } | undefined;
  #prevVirtualItems: VirtualItem[] | undefined;

  constructor(
    layoutStrategy: LayoutStrategy,
    scrollSource: ScrollSource,
    options: VirtualizerOptions
  ) {
    this.#layoutStrategy = layoutStrategy;
    this.#scrollSource = scrollSource;
    this.#count = options.count;
    this.#overscan = options.overscan ?? 4;
    this.#onChange = options.onChange;
    this.#plugins = [];

    this.#state = this.#calculateState();

    this.#plugins.forEach((plugin) => plugin.onInit?.());

    this.#unsubscribe = this.#scrollSource.subscribe(() => {
      this.update();
    });
  }

  addPlugin(plugin: Plugin): void {
    this.#plugins.push(plugin);
    plugin.onInit?.();
    this.#prevRenderRange = undefined;
    this.#prevVirtualItems = undefined;
  }

  getState(): VirtualizerState {
    return this.#state;
  }

  setCount(count: number): void {
    if (this.#count !== count) {
      this.#count = count;
      this.#prevRenderRange = undefined;
      this.#prevVirtualItems = undefined;
      this.update();
    }
  }

  update(): void {
    const newState = this.#calculateState();

    let finalState = newState;
    for (const plugin of this.#plugins) {
      const result = plugin.beforeStateChange?.(finalState);
      if (result) finalState = result;
    }

    this.#state = finalState;

    this.#plugins.forEach((plugin) => plugin.afterStateChange?.(this.#state));

    this.#onChange?.(this.#state);
  }

  #calculateState(): VirtualizerState {
    const scrollOffset = this.#scrollSource.getScrollOffset();
    const viewportSize = this.#scrollSource.getViewportSize();
    const totalSize = this.#layoutStrategy.getTotalSize(this.#count);
    const virtualSize =
      this.#layoutStrategy.getVirtualSize?.(this.#count) ?? totalSize;
    const isClamped = virtualSize > totalSize;

    const visibleRange = this.#layoutStrategy.getVisibleRange(
      scrollOffset,
      viewportSize,
      this.#count
    );

    let renderRange = {
      startIndex: Math.max(0, visibleRange.startIndex - this.#overscan),
      endIndex: Math.min(
        this.#count - 1,
        visibleRange.endIndex + this.#overscan
      ),
    };

    for (const plugin of this.#plugins) {
      if (plugin.onRangeCalculated) {
        renderRange = plugin.onRangeCalculated(visibleRange, this.#count);
      }
    }

    const virtualOffset = mapToVirtualOffset(
      scrollOffset,
      viewportSize,
      virtualSize,
      totalSize
    );

    let virtualItems: VirtualItem[];
    if (
      !isClamped &&
      this.#prevRenderRange &&
      this.#prevVirtualItems &&
      this.#prevRenderRange.startIndex === renderRange.startIndex &&
      this.#prevRenderRange.endIndex === renderRange.endIndex
    ) {
      virtualItems = this.#prevVirtualItems;
    } else {
      virtualItems = [];
      const startIdx = renderRange.startIndex;
      const endIdx = renderRange.endIndex;

      for (let i = startIdx; i <= endIdx; i++) {
        const virtualStart = this.#layoutStrategy.getItemOffset(i);
        const size = this.#layoutStrategy.getItemSize(i);
        const start = scrollOffset + (virtualStart - virtualOffset);
        virtualItems.push({
          index: i,
          start,
          size,
          end: start + size,
        });
      }

      this.#prevRenderRange = renderRange;
      this.#prevVirtualItems = virtualItems;
    }

    return {
      scrollOffset,
      viewportSize,
      totalSize,
      visibleRange,
      renderRange,
      virtualItems,
    };
  }

  destroy(): void {
    this.#unsubscribe?.();
    this.#plugins.forEach((plugin) => plugin.onDestroy?.());
  }
}
