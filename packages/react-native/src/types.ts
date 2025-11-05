import type { ReactNode } from "react";
import type { ViewStyle, ScrollViewProps } from "react-native";
import type { PageResponse, Range } from "@scrolloop/shared";

export type { PageResponse, Range };

export interface ItemProps {
  key: number | string;
}

export interface VirtualListProps extends Omit<ScrollViewProps, "onScroll"> {
  count: number;
  itemSize: number;
  renderItem: (index: number, style: ViewStyle) => ReactNode;
  height?: number;
  overscan?: number;
  onRangeChange?: (range: Range) => void;
}

export interface InfiniteListProps<T>
  extends Omit<ScrollViewProps, "onScroll"> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  renderItem: (
    item: T | undefined,
    index: number,
    style: ViewStyle
  ) => ReactNode;
  itemSize: number;

  pageSize?: number;
  initialPage?: number;
  prefetchThreshold?: number;

  height?: number;
  overscan?: number;

  renderLoading?: () => ReactNode;
  renderError?: (error: Error, retry: () => void) => ReactNode;
  renderEmpty?: () => ReactNode;

  onPageLoad?: (page: number, items: T[]) => void;
  onError?: (error: Error) => void;
}
