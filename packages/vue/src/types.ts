import type { PageResponse } from "@scrolloop/core";

export interface VirtualListProps {
  count: number;
  itemSize: number;
  height?: number;
  overscan?: number;
  class?: string;
}

export interface InfiniteListProps<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  itemSize: number;
  pageSize?: number;
  initialPage?: number;
  prefetchThreshold?: number;
  height?: number;
  overscan?: number;
  class?: string;
}

export type ItemStyle = Record<string, string>;
