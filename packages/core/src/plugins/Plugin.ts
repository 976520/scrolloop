import type { VirtualizerState, Range } from '../types';

export interface Plugin {
  name: string;

  onInit?(): void;

  beforeStateChange?(state: VirtualizerState): VirtualizerState | void;

  afterStateChange?(state: VirtualizerState): void;

  onRangeCalculated?(visibleRange: Range, count: number): Range;

  onDestroy?(): void;
}

