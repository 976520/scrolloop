import { useEffect, memo, useMemo, useCallback } from "react";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { useInfinitePages, findMissingPages } from "@scrolloop/shared";
import type { CSSProperties } from "react";

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

  const overscan = useMemo(
    () => userOverscan ?? Math.max(20, pageSize * 2),
    [userOverscan, pageSize]
  );

  const { allItems, pages, loadingPages, hasMore, error, loadPage, retry } =
    useInfinitePages({
      fetchPage,
      pageSize,
      initialPage,
      onPageLoad,
      onError,
    });

  useEffect(() => {
    if (pages.size === 0 && !error) {
      const totalNeededItems = Math.ceil(height / itemSize) + overscan * 2;
      for (
        let page = 0;
        page < Math.ceil(totalNeededItems / pageSize) + prefetchThreshold;
        page++
      )
        loadPage(page);
    }
  }, [
    pages.size,
    loadPage,
    initialPage,
    error,
    height,
    itemSize,
    pageSize,
    prefetchThreshold,
    overscan,
  ]);

  const handleRangeChange = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const prefetchStart = Math.max(
        0,
        Math.floor(range.startIndex / pageSize) -
          Math.floor(range.endIndex / pageSize)
      );
      const prefetchEnd =
        Math.floor(range.endIndex / pageSize) +
        prefetchThreshold +
        Math.ceil(overscan / pageSize);

      findMissingPages(prefetchStart, prefetchEnd, pages, loadingPages);

      for (let page = prefetchStart; page <= prefetchEnd; page++) {
        loadPage(page);
      }
    },
    [pageSize, prefetchThreshold, overscan, pages, loadingPages, loadPage]
  );

  const virtualListRenderItem = useCallback(
    (index: number, itemStyle: CSSProperties) => {
      const item = allItems[index];
      return renderItem(item, index, itemStyle);
    },
    [allItems, renderItem]
  );

  const errorContainerStyle = useMemo<CSSProperties>(
    () => ({
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [height]
  );

  const errorContentStyle = useMemo<CSSProperties>(
    () => ({
      textAlign: "center",
    }),
    []
  );

  const errorMessageStyle = useMemo<CSSProperties>(
    () => ({
      color: "#666",
      fontSize: "0.9em",
    }),
    []
  );

  const retryButtonStyle = useMemo<CSSProperties>(
    () => ({
      marginTop: 8,
      padding: "4px 12px",
      cursor: "pointer",
    }),
    []
  );

  const loadingContainerStyle = useMemo<CSSProperties>(
    () => ({
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [height]
  );

  const emptyContainerStyle = useMemo<CSSProperties>(
    () => ({
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),
    [height]
  );

  const heightOnlyStyle = useMemo<CSSProperties>(() => ({ height }), [height]);

  if (error && allItems.length === 0) {
    if (renderError)
      return <div style={heightOnlyStyle}>{renderError(error, retry)}</div>;
    return (
      <div style={errorContainerStyle}>
        <div style={errorContentStyle}>
          <p>Error.</p>
          <p style={errorMessageStyle}>{error.message}</p>
          <button onClick={retry} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (allItems.length === 0 && loadingPages.size > 0) {
    if (renderLoading) {
      return <div style={heightOnlyStyle}>{renderLoading()}</div>;
    }
    return (
      <div style={loadingContainerStyle}>
        <p>Loading...</p>
      </div>
    );
  }

  if (allItems.length === 0 && !hasMore) {
    if (renderEmpty) {
      return <div style={heightOnlyStyle}>{renderEmpty()}</div>;
    }
    return (
      <div style={emptyContainerStyle}>
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
      renderItem={virtualListRenderItem}
    />
  );
}

export const InfiniteList = memo(InfiniteListInner) as <T>(
  props: InfiniteListProps<T>
) => JSX.Element;
