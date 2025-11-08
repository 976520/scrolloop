import { useEffect, memo, useMemo, useCallback, useRef } from "react";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { FullList } from "./FullList";
import { useInfinitePages, findMissingPages } from "@scrolloop/shared";
import { useTransition } from "../hooks/useTransition";
import { calculateVirtualRange } from "@scrolloop/core";
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
    isSSR = false,
    transitionStrategy,
    initialData,
    initialTotal,
  } = props;

  const overscan = useMemo(
    () => userOverscan ?? Math.max(20, pageSize * 2),
    [userOverscan, pageSize]
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const initialPagesRef = useRef<Map<number, T[]>>(new Map());
  const initialTotalRef = useRef(0);
  const initialHasMoreRef = useRef(true);

  if (isSSR && initialData && initialData.length > 0) {
    const initialPages = new Map<number, T[]>();
    const totalPages = Math.ceil(initialData.length / pageSize);

    for (let i = 0; i < totalPages; i++) {
      const start = i * pageSize;
      const end = start + pageSize;
      initialPages.set(i, initialData.slice(start, end));
    }

    initialPagesRef.current = initialPages;
    initialTotalRef.current = initialTotal ?? initialData.length;
    initialHasMoreRef.current = initialTotal
      ? initialData.length < initialTotal
      : true;
  }

  const { allItems, pages, loadingPages, hasMore, error, loadPage, retry } =
    useInfinitePages({
      fetchPage,
      pageSize,
      initialPage,
      onPageLoad,
      onError,
    });

  const mergedPages = useMemo(() => {
    if (isSSR && initialPagesRef.current.size > 0) {
      const merged = new Map(pages);
      initialPagesRef.current.forEach((items, pageNum) => {
        if (!merged.has(pageNum)) {
          merged.set(pageNum, items);
        }
      });
      return merged;
    }
    return pages;
  }, [pages, isSSR]);

  const mergedTotal = useMemo(() => {
    if (isSSR && initialTotalRef.current > 0) {
      return Math.max(initialTotalRef.current, allItems.length);
    }
    return allItems.length;
  }, [isSSR, allItems.length]);

  const mergedHasMore = useMemo(() => {
    if (isSSR && initialPagesRef.current.size > 0) {
      return initialHasMoreRef.current || hasMore;
    }
    return hasMore;
  }, [isSSR, hasMore]);

  const mergedAllItems = useMemo(() => {
    if (isSSR && initialData && initialData.length > 0) {
      const items: (T | undefined)[] = new Array(mergedTotal);

      initialData.forEach((item, index) => {
        items[index] = item;
      });

      mergedPages.forEach((pageItems, pageNum) => {
        const startIndex = pageNum * pageSize;
        pageItems.forEach((item, i) => {
          items[startIndex + i] = item;
        });
      });

      return items;
    }
    return allItems;
  }, [isSSR, initialData, mergedTotal, mergedPages, pageSize, allItems]);

  useEffect(() => {
    if (!isSSR && mergedPages.size === 0 && !error) {
      const totalNeededItems = Math.ceil(height / itemSize) + overscan * 2;
      for (
        let page = 0;
        page < Math.ceil(totalNeededItems / pageSize) + prefetchThreshold;
        page++
      )
        loadPage(page);
    }
  }, [
    isSSR,
    mergedPages.size,
    loadPage,
    initialPage,
    error,
    height,
    itemSize,
    pageSize,
    prefetchThreshold,
    overscan,
  ]);

  const scrollTopRef = useRef(0);
  const visibleRange = useMemo(() => {
    const scrollTop = scrollTopRef.current;
    const { renderStart, renderEnd } = calculateVirtualRange(
      scrollTop,
      height,
      itemSize,
      mergedAllItems.length,
      overscan,
      scrollTop
    );
    return { start: renderStart, end: renderEnd };
  }, [height, itemSize, mergedAllItems.length, overscan]);

  const { isVirtualized } = useTransition({
    enabled: isSSR,
    containerRef,
    itemSize,
    totalItems: mergedAllItems.length,
    visibleRange,
    strategy: transitionStrategy,
  });

  const handleRangeChange = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      if (isSSR && !isVirtualized) {
        scrollTopRef.current = containerRef.current?.scrollTop ?? 0;
        return;
      }

      const prefetchStart = Math.max(
        0,
        Math.floor(range.startIndex / pageSize) -
          Math.floor(range.endIndex / pageSize)
      );
      const prefetchEnd =
        Math.floor(range.endIndex / pageSize) +
        prefetchThreshold +
        Math.ceil(overscan / pageSize);

      findMissingPages(prefetchStart, prefetchEnd, mergedPages, loadingPages);

      for (let page = prefetchStart; page <= prefetchEnd; page++) {
        loadPage(page);
      }
    },
    [
      isSSR,
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
    if (!isSSR || !containerRef.current) return;

    const container = containerRef.current;
    const handleScroll = () => {
      scrollTopRef.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isSSR]);

  const virtualListRenderItem = useCallback(
    (index: number, itemStyle: CSSProperties) => {
      const item = mergedAllItems[index];
      return renderItem(item, index, itemStyle);
    },
    [mergedAllItems, renderItem]
  );

  const FullRenderItem = useCallback(
    (item: T | undefined, index: number, style: CSSProperties) => {
      return renderItem(item, index, style);
    },
    [renderItem]
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

  if (error && mergedAllItems.length === 0) {
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

  if (mergedAllItems.length === 0 && loadingPages.size > 0) {
    if (renderLoading) {
      return <div style={heightOnlyStyle}>{renderLoading()}</div>;
    }
    return (
      <div style={loadingContainerStyle}>
        <p>Loading...</p>
      </div>
    );
  }

  if (mergedAllItems.length === 0 && !mergedHasMore) {
    if (renderEmpty) {
      return <div style={heightOnlyStyle}>{renderEmpty()}</div>;
    }
    return (
      <div style={emptyContainerStyle}>
        <p>No data.</p>
      </div>
    );
  }

  if (isSSR && !isVirtualized) {
    return (
      <FullList
        ref={containerRef}
        items={mergedAllItems}
        renderItem={FullRenderItem}
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
      renderItem={virtualListRenderItem}
    />
  );
}

export const InfiniteList = memo(InfiniteListInner) as <T>(
  props: InfiniteListProps<T>
) => JSX.Element;
