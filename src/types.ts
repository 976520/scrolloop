import type { CSSProperties, ReactNode, HTMLAttributes } from "react";

export interface ItemProps extends HTMLAttributes<HTMLElement> {
  key: number | string;
  role?: string;
}

export interface Range {
  startIndex: number;
  endIndex: number;
}

export interface VirtualListProps {
  count: number;
  itemSize: number;
  renderItem: (index: number, style: CSSProperties) => ReactNode;
  height?: number;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
  onRangeChange?: (range: Range) => void;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface InfiniteListProps<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  renderItem: (item: T | undefined, index: number, style: CSSProperties) => ReactNode;
  itemSize: number;

  pageSize?: number;
  initialPage?: number;
  prefetchThreshold?: number;

  height?: number;
  overscan?: number;
  className?: string;
  style?: CSSProperties;

  renderLoading?: () => ReactNode;
  renderError?: (error: Error, retry: () => void) => ReactNode;
  renderEmpty?: () => ReactNode;

  onPageLoad?: (page: number, items: T[]) => void;
  onError?: (error: Error) => void;
}

