export interface Range {
  startIndex: number;
  endIndex: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  end: number;
}

export interface VirtualizerState {
  scrollOffset: number;
  viewportSize: number;
  totalSize: number;
  visibleRange: Range;
  renderRange: Range;
  virtualItems: VirtualItem[];
}

export interface ScrollToOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth';
}

export interface VirtualizerOptions {
  count: number;
  overscan?: number;
  onChange?: (state: VirtualizerState) => void;
}

