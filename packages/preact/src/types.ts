import type { CSSProperties, VNode } from "preact";
import type { PageResponse, Range } from "@scrolloop/shared";

export type { PageResponse, Range };

export interface VirtualListProps {
  count: number;
  itemSize: number;
  renderItem: (index: number, style: CSSProperties) => VNode | null;
  height?: number;
  overscan?: number;
  class?: string;
  style?: CSSProperties;
  onRangeChange?: (range: Range) => void;
}

export interface InfiniteListProps<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  renderItem: (
    item: T | undefined,
    index: number,
    style: CSSProperties
  ) => VNode | null;
  itemSize: number;
  pageSize?: number;
  initialPage?: number;
  height?: number;
  overscan?: number;
  class?: string;
  style?: CSSProperties;
  renderLoading?: () => VNode | null;
  renderError?: (error: Error, retry: () => void) => VNode | null;
  renderEmpty?: () => VNode | null;
  onPageLoad?: (page: number, items: T[]) => void;
  onError?: (error: Error) => void;
}
