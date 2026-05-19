import { useEffect, useCallback, useMemo } from "preact/hooks";
import type { CSSProperties } from "preact";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { useInfinitePages } from "../hooks/useInfinitePages";
import "./infiniteList.css";

export function InfiniteList<T>({
  fetchPage,
  renderItem,
  itemSize,
  pageSize = 20,
  initialPage = 0,
  height = 400,
  overscan: userOverscan,
  class: className,
  style,
  renderLoading,
  renderError,
  renderEmpty,
  onPageLoad,
  onError,
}: InfiniteListProps<T>) {
  const overscan = useMemo(
    () => userOverscan ?? Math.max(20, pageSize * 2),
    [userOverscan, pageSize]
  );

  const { pages, total, loadingPages, hasMore, error, loadPage, retry } =
    useInfinitePages({ fetchPage, pageSize, initialPage, onPageLoad, onError });

  useEffect(() => {
    if (total === 0 && !error) {
      const needed = Math.ceil(height / itemSize) + overscan * 2;
      const pagesToLoad = Math.ceil(needed / pageSize);
      for (let p = 0; p < pagesToLoad; p++) loadPage(p);
    }
  }, [total, error, height, itemSize, pageSize, overscan, loadPage]);

  const handleRangeChange = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const ps = (range.startIndex / pageSize) | 0;
      const pe = ((range.endIndex / pageSize) | 0) + 1;
      for (let p = ps; p <= pe; p++) loadPage(p);
    },
    [pageSize, loadPage]
  );

  const virtualRenderItem = useCallback(
    (index: number, itemStyle: CSSProperties) =>
      renderItem(
        pages.get(Math.floor(index / pageSize))?.[index % pageSize],
        index,
        itemStyle
      ),
    [pages, pageSize, renderItem]
  );

  if (error && total === 0) {
    if (renderError)
      return <div style={{ height }}>{renderError(error, retry)}</div>;
    return (
      <div class="scrolloop-state-container" style={{ height }}>
        <div class="scrolloop-error-content">
          <p class="scrolloop-error-message">Error.</p>
          <p class="scrolloop-error-detail">{error.message}</p>
          <button class="scrolloop-retry-button" onClick={retry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (total === 0 && loadingPages.size > 0) {
    if (renderLoading) return <div style={{ height }}>{renderLoading()}</div>;
    return (
      <div class="scrolloop-state-container" style={{ height }}>
        <p class="scrolloop-state-text">Loading...</p>
      </div>
    );
  }

  if (total === 0 && !hasMore) {
    if (renderEmpty) return <div style={{ height }}>{renderEmpty()}</div>;
    return (
      <div class="scrolloop-state-container" style={{ height }}>
        <p class="scrolloop-state-text">No data.</p>
      </div>
    );
  }

  return (
    <VirtualList
      count={total}
      itemSize={itemSize}
      height={height}
      overscan={overscan}
      class={className}
      style={style}
      onRangeChange={handleRangeChange}
      renderItem={virtualRenderItem}
    />
  );
}
