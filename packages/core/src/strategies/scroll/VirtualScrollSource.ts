import type { ScrollSource } from './ScrollSource';

export class VirtualScrollSource implements ScrollSource {
  private scrollOffset = 0;
  private viewportSize = 0;
  private listeners = new Set<(offset: number) => void>();

  getScrollOffset(): number {
    return this.scrollOffset;
  }

  getViewportSize(): number {
    return this.viewportSize;
  }

  setScrollOffset(offset: number): void {
    if (this.scrollOffset !== offset) {
      this.scrollOffset = offset;
      this.notifyListeners();
    }
  }

  setViewportSize(size: number): void {
    this.viewportSize = size;
  }

  subscribe(callback: (offset: number) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.scrollOffset));
  }
}

