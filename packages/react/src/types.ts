import type { CSSProperties, ReactNode, HTMLAttributes } from "react";
import type { PageResponse, Range } from "@scrolloop/shared";

export type { PageResponse, Range };

export type SSRTransitionState =
  | { type: "SSR_DOM" }
  | { type: "HYDRATED" }
  | { type: "SWITCHING"; snapshot: TransitionSnapshot }
  | { type: "VIRTUALIZED" };
export interface TransitionSnapshot {
  scrollTop: number;
  viewportHeight: number;
  firstVisibleIndex: number;
  focusedElement: HTMLElement | null;
  focusedElementId: string | null;
  itemMeasurements: Map<number, number>;
}

export interface TransitionStrategy {
  switchTrigger?: "immediate" | "first-interaction" | "idle";
  transitionStrategy?: "abort" | "replace-offscreen";
  pruneStrategy?: "idle" | "chunk";
  chunkSize?: number;
}

export interface ItemProps extends HTMLAttributes<HTMLElement> {
  key: number | string;
  role?: string;
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

export interface InfiniteListProps<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  renderItem: (
    item: T | undefined,
    index: number,
    style: CSSProperties
  ) => ReactNode;
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

  isSSR?: boolean;
  transitionStrategy?: TransitionStrategy;

  initialData?: T[];
  initialTotal?: number;
}

export interface FullListProps<T> {
  items: (T | undefined)[];
  renderItem: (
    item: T | undefined,
    index: number,
    style: CSSProperties
  ) => ReactNode;
  itemSize: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  "data-ssr-list"?: boolean;
}
