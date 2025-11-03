import { useEffect, memo } from "react";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { useInfinitePages } from "../hooks/useInfinitePages";
import { findMissingPages } from "../utils/findMissingPages";

function InfiniteListInner<T>(props: InfiniteListProps<T>) {
  const {
    fetchPage,
    renderItem,
    itemSize,
    pageSize = 20,
    initialPage = 0,
    prefetchThreshold = 1,
    height = 400,
    overscan: userOverscan,
    className,
    style,
    renderLoading,
    renderError,
    renderEmpty,
    onPageLoad,
    onError,
  } = props;

  const overscan = userOverscan ?? Math.max(20, pageSize * 2);

  const {
    allItems,
    pages,
    loadingPages,
    hasMore,
    error,
    loadPage,
    retry,
  } = useInfinitePages({
    fetchPage,
    pageSize,
    initialPage,
    onPageLoad,
    onError,
  });

  useEffect(() => {
    if (pages.size === 0 && !error) {
      const overscanCount = overscan * 2;
      const totalNeededItems = Math.ceil(height / itemSize) + overscanCount;
      for (let page = 0; page < (Math.ceil(totalNeededItems / pageSize) + prefetchThreshold); page++) loadPage(page);
    }
  }, [pages.size, loadPage, initialPage, error, height, itemSize, pageSize, prefetchThreshold, overscan]);

  const handleRangeChange = (range: { startIndex: number; endIndex: number }) => {
    const prefetchStart = Math.max(0, Math.floor(range.startIndex / pageSize) - Math.floor(range.endIndex / pageSize));
    const prefetchEnd = Math.floor(range.endIndex / pageSize) + prefetchThreshold + Math.ceil(overscan / pageSize);

    findMissingPages(prefetchStart, prefetchEnd, pages, loadingPages);

    for (let page = prefetchStart; page <= prefetchEnd; page++) {
      loadPage(page);
    }
  };

  if (error && allItems.length === 0) {
    if (renderError) return <div style={{ height }}>{renderError(error, retry)}</div>;
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p>Error.</p>
          <p style={{ color: "#666", fontSize: "0.9em" }}>{error.message}</p>
          <button onClick={retry} style={{ marginTop: 8, padding: "4px 12px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (allItems.length === 0 && loadingPages.size > 0) {
    if (renderLoading) {
      return <div style={{ height }}>{renderLoading()}</div>;
    }
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (allItems.length === 0 && !hasMore) {
    if (renderEmpty) {
      return <div style={{ height }}>{renderEmpty()}</div>;
    }
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>No data.</p>
      </div>
    );
  }

  return (
    <VirtualList
      count={allItems.length}
      itemSize={itemSize}
      height={height}
      overscan={overscan}
      className={className}
      style={style}
      onRangeChange={handleRangeChange}
      renderItem={(index, itemStyle) => {
        const item = allItems[index];
        return renderItem(item, index, itemStyle);
      }}
    />
  );
}

export const InfiniteList = memo(InfiniteListInner) as <T>(
  props: InfiniteListProps<T>
) => JSX.Element;

