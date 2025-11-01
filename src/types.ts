import type { CSSProperties, ReactNode } from "react";

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

