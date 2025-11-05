export interface ScrollSource {
  getScrollOffset(): number;

  getViewportSize(): number;

  setScrollOffset(offset: number): void;

  subscribe(callback: (offset: number) => void): () => void;
}

