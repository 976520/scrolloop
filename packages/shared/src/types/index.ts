export interface Range {
  startIndex: number;
  endIndex: number;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}
