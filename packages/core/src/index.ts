export { Virtualizer } from './virtualizer/Virtualizer';

export { FixedLayoutStrategy } from './strategies/layout/FixedLayoutStrategy';
export { VirtualScrollSource } from './strategies/scroll/VirtualScrollSource';
export type { LayoutStrategy } from './strategies/layout/LayoutStrategy';
export type { ScrollSource } from './strategies/scroll/ScrollSource';

export { OverscanPlugin } from './plugins/OverscanPlugin';
export type { Plugin } from './plugins/Plugin';

export type {
  Range,
  VirtualItem,
  VirtualizerState,
  VirtualizerOptions,
  ScrollToOptions,
} from './types';

export { clamp } from './utils/clamp';

