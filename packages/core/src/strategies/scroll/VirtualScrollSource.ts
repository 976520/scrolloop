import type { ScrollSource } from "./ScrollSource";

export class VirtualScrollSource implements ScrollSource {
  #scrollOffset = 0;
  #viewportSize = 0;
  #listeners = new Set<(offset: number) => void>();

  getScrollOffset(): number {
    return this.#scrollOffset;
  }

  getViewportSize(): number {
    return this.#viewportSize;
  }

  setScrollOffset(offset: number): void {
    if (this.#scrollOffset !== offset) {
      this.#scrollOffset = offset;
      this.#notifyListeners();
    }
  }

  setViewportSize(size: number): void {
    if (this.#viewportSize !== size) {
      this.#viewportSize = size;
      this.#notifyListeners();
    }
  }

  subscribe(callback: (offset: number) => void): () => void {
    this.#listeners.add(callback);
    return () => {
      this.#listeners.delete(callback);
    };
  }

  #notifyListeners(): void {
    this.#listeners.forEach((listener) => listener(this.#scrollOffset));
  }
}
