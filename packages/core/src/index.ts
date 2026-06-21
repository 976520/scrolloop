export { Virtualizer } from "./virtualizer/Virtualizer";

export { FixedLayoutStrategy } from "./strategies/layout/FixedLayoutStrategy";
export { VirtualScrollSource } from "./strategies/scroll/VirtualScrollSource";
export type { LayoutStrategy } from "./strategies/layout/LayoutStrategy";
export type { ScrollSource } from "./strategies/scroll/ScrollSource";

export { OverscanPlugin } from "./plugins/OverscanPlugin";
export type { Plugin } from "./plugins/Plugin";

export type {
  Range,
  VirtualItem,
  VirtualizerState,
  VirtualizerOptions,
  ScrollToOptions,
  VirtualRange,
  PageResponse,
} from "./types";

export { clamp } from "./utils/clamp";
export { calculateVirtualRange } from "./utils/calculateVirtualRange";
export {
  getMaxElementSize,
  resetMaxElementSizeCache,
} from "./utils/getMaxElementSize";

export { InfiniteSource } from "./InfiniteSource";
export type {
  InfiniteSourceState,
  InfiniteSourceOptions,
} from "./InfiniteSource";
export { canLoadPage } from "./utils/canLoadPage";
export { findMissingPages } from "./utils/findMissingPages";
