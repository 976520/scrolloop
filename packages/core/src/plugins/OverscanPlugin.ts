import type { Plugin } from './Plugin';
import type { Range } from '../types';

export class OverscanPlugin implements Plugin {
  name = 'overscan';

  constructor(private overscan: number = 4) {}

  onRangeCalculated(visibleRange: Range, count: number): Range {
    const { startIndex, endIndex } = visibleRange;

    const renderStartIndex = Math.max(0, startIndex - this.overscan);
    const renderEndIndex = Math.min(count - 1, endIndex + this.overscan);

    return {
      startIndex: renderStartIndex,
      endIndex: renderEndIndex,
    };
  }
}

