import { useEffect, memo, useMemo, useCallback, useRef } from "react";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { FullList } from "./FullList";
import { useInfinitePages, findMissingPages } from "@scrolloop/shared";
import { useTransition } from "../hooks/useTransition";
import { calculateVirtualRange } from "@scrolloop/core";
import type { CSSProperties } from "react";
import { isServerSide as isServerSideEnvironment } from "../utils/isServerSide";

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
    isServerSide = false,
    transitionStrategy,
    initialData,
    initialTotal,
  } = props;

  const overscan = useMemo(
    () => userOverscan ?? Math.max(20, pageSize * 2),
    [userOverscan, pageSize]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);

  const { allItems, pages, loadingPages, hasMore, error, loadPage, retry } =
    useInfinitePages({ fetchPage, pageSize, initialPage, onPageLoad, onError });

  const ssrData = useMemo(() => {
    if (!isServerSide || !initialData?.length) return null;
    const initialPages = new Map<number, T[]>();
    const totalPages = Math.ceil(initialData.length / pageSize);
    for (let i = 0; i < totalPages; i++) {
      initialPages.set(i, initialData.slice(i * pageSize, (i + 1) * pageSize));
    }
    const total = initialTotal ?? initialData.length;
    return {
      pages: initialPages,
      total,
      hasMore: initialTotal ? initialData.length < initialTotal : true,
    };
  }, [isServerSide, initialData, initialTotal, pageSize]);

  const mergedPages = useMemo(() => {
    if (ssrData) {
      const merged = new Map(pages);
      ssrData.pages.forEach((v, k) => !merged.has(k) && merged.set(k, v));
      return merged;
    }
    return pages;
  }, [pages, ssrData]);

  const mergedTotal = ssrData
    ? Math.max(ssrData.total, allItems.length)
    : allItems.length;
  const mergedHasMore = ssrData ? ssrData.hasMore || hasMore : hasMore;

  const mergedAllItems = useMemo(() => {
    if (ssrData && initialData) {
      const items = new Array(mergedTotal);
      initialData.forEach((v, i) => (items[i] = v));
      mergedPages.forEach((v, k) => {
        const start = k * pageSize;
        v.forEach((it, i) => (items[start + i] = it));
      });
      return items;
    }
    return allItems;
  }, [ssrData, initialData, mergedTotal, mergedPages, pageSize, allItems]);

  useEffect(() => {
    if (!isServerSide && !mergedPages.size && !error) {
      const needed = Math.ceil(height / itemSize) + overscan * 2;
      for (let p = 0; p < Math.ceil(needed / pageSize) + prefetchThreshold; p++)
        loadPage(p);
    }
  }, [
    isServerSide,
    mergedPages.size,
    loadPage,
    error,
    height,
    itemSize,
    pageSize,
    prefetchThreshold,
    overscan,
  ]);

  const visibleRange = useMemo(() => {
    const st = scrollTopRef.current;
    const { renderStart, renderEnd } = calculateVirtualRange(
      st,
      height,
      itemSize,
      mergedAllItems.length,
      overscan,
      st
    );
    return { start: renderStart, end: renderEnd };
  }, [height, itemSize, mergedAllItems.length, overscan]);

  const { isVirtualized } = useTransition({
    enabled: isServerSide,
    containerRef,
    itemSize,
    totalItems: mergedAllItems.length,
    visibleRange,
    strategy: transitionStrategy,
  });

  const handleRangeChange = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      if (isServerSide && !isVirtualized) {
        scrollTopRef.current = containerRef.current?.scrollTop ?? 0;
        return;
      }
      const ps = Math.max(
        0,
        ((range.startIndex / pageSize) | 0) - ((range.endIndex / pageSize) | 0)
      );
      const pe =
        ((range.endIndex / pageSize) | 0) +
        prefetchThreshold +
        Math.ceil(overscan / pageSize);
      findMissingPages(ps, pe, mergedPages, loadingPages);
      for (let p = ps; p <= pe; p++) loadPage(p);
    },
    [
      isServerSide,
      isVirtualized,
      pageSize,
      prefetchThreshold,
      overscan,
      mergedPages,
      loadingPages,
      loadPage,
    ]
  );

  useEffect(() => {
    if (!isServerSide || !containerRef.current) return;
    const scroll = () => {
      scrollTopRef.current = containerRef.current?.scrollTop ?? 0;
    };
    containerRef.current.addEventListener("scroll", scroll, { passive: true });
    return () => containerRef.current?.removeEventListener("scroll", scroll);
  }, [isServerSide]);

  const commonContainerStyle: CSSProperties = {
    height,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const heightOnlyStyle: CSSProperties = { height };

  if (error && !mergedAllItems.length) {
    if (renderError)
      return <div style={heightOnlyStyle}>{renderError(error, retry)}</div>;
    return (
      <div style={commonContainerStyle}>
        <div style={{ textAlign: "center" }}>
          <p>Error.</p>
          <p style={{ color: "#666", fontSize: "0.9em" }}>{error.message}</p>
          <button
            onClick={retry}
            style={{ marginTop: 8, padding: "4px 12px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!mergedAllItems.length && loadingPages.size) {
    return renderLoading ? (
      <div style={heightOnlyStyle}>{renderLoading()}</div>
    ) : (
      <div style={commonContainerStyle}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!mergedAllItems.length && !mergedHasMore) {
    return renderEmpty ? (
      <div style={heightOnlyStyle}>{renderEmpty()}</div>
    ) : (
      <div style={commonContainerStyle}>
        <p>No data.</p>
      </div>
    );
  }

  if (isServerSideEnvironment() || (isServerSide && !isVirtualized)) {
    return (
      <FullList
        ref={containerRef}
        items={mergedAllItems}
        renderItem={renderItem}
        itemSize={itemSize}
        height={height}
        className={className}
        style={style}
        data-ssr-list={true}
      />
    );
  }

  return (
    <VirtualList
      count={mergedAllItems.length}
      itemSize={itemSize}
      height={height}
      overscan={overscan}
      className={className}
      style={style}
      onRangeChange={handleRangeChange}
      renderItem={(index, itemStyle) =>
        renderItem(mergedAllItems[index], index, itemStyle)
      }
    />
  );
}

export const InfiniteList = memo(InfiniteListInner) as <T>(
  props: InfiniteListProps<T>
) => JSX.Element;
