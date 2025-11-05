import type {
  VirtualItem,
  VirtualizerState,
  VirtualizerOptions,
} from '../types';
import type { LayoutStrategy } from '../strategies/layout/LayoutStrategy';
import type { ScrollSource } from '../strategies/scroll/ScrollSource';
import type { Plugin } from '../plugins/Plugin';

export class Virtualizer {
  private count: number;
  private overscan: number;
  private plugins: Plugin[];
  private onChange?: (state: VirtualizerState) => void;

  private layoutStrategy: LayoutStrategy;
  private scrollSource: ScrollSource;

  private state: VirtualizerState;
  private unsubscribe?: () => void;

  constructor(
    layoutStrategy: LayoutStrategy,
    scrollSource: ScrollSource,
    options: VirtualizerOptions
  ) {
    this.layoutStrategy = layoutStrategy;
    this.scrollSource = scrollSource;
    this.count = options.count;
    this.overscan = options.overscan ?? 4;
    this.onChange = options.onChange;
    this.plugins = [];

    this.state = this.calculateState();

    this.plugins.forEach((plugin) => plugin.onInit?.());

    this.unsubscribe = this.scrollSource.subscribe(() => {
      this.update();
    });
  }

  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    plugin.onInit?.();
  }

  getState(): VirtualizerState {
    return this.state;
  }

  setCount(count: number): void {
    if (this.count !== count) {
      this.count = count;
      this.update();
    }
  }

  update(): void {
    const newState = this.calculateState();

    let finalState = newState;
    for (const plugin of this.plugins) {
      const result = plugin.beforeStateChange?.(finalState);
      if (result) finalState = result;
    }

    this.state = finalState;

    this.plugins.forEach((plugin) => plugin.afterStateChange?.(this.state));

    this.onChange?.(this.state);
  }

  private calculateState(): VirtualizerState {
    const scrollOffset = this.scrollSource.getScrollOffset();
    const viewportSize = this.scrollSource.getViewportSize();
    const totalSize = this.layoutStrategy.getTotalSize(this.count);

    let visibleRange = this.layoutStrategy.getVisibleRange(
      scrollOffset,
      viewportSize,
      this.count
    );

    let renderRange = {
      startIndex: Math.max(0, visibleRange.startIndex - this.overscan),
      endIndex: Math.min(this.count - 1, visibleRange.endIndex + this.overscan),
    };
    
    for (const plugin of this.plugins) {
      if (plugin.onRangeCalculated) {
        renderRange = plugin.onRangeCalculated(visibleRange, this.count);
      }
    }

    const virtualItems: VirtualItem[] = [];
    for (let i = renderRange.startIndex; i <= renderRange.endIndex; i++) {
      const start = this.layoutStrategy.getItemOffset(i);
      const size = this.layoutStrategy.getItemSize(i);
      virtualItems.push({
        index: i,
        start,
        size,
        end: start + size,
      });
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
    this.unsubscribe?.();
    this.plugins.forEach((plugin) => plugin.onDestroy?.());
  }
}

