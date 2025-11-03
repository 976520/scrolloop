import { useEffect, memo } from "react";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { useInfinitePages } from "../hooks/useInfinitePages";

function InfiniteListInner<T>(props: InfiniteListProps<T>) {
  const {
    fetchPage,
    renderItem,
    itemSize,
    pageSize = 20,
    initialPage = 0,
    prefetchThreshold = 1,
    height = 400,
    overscan = 4,
    className,
    style,
    renderLoading,
    renderError,
    renderEmpty,
    onPageLoad,
    onError,
  } = props;

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
      loadPage(initialPage);
    }
  }, [pages.size, loadPage, initialPage, error]);

  const handleRangeChange = (range: { startIndex: number; endIndex: number }) => {
    const currentPage = Math.floor(range.endIndex / pageSize);
    const nextPage = currentPage + prefetchThreshold;

    loadPage(currentPage);
    if (hasMore) {
      loadPage(nextPage);
    }
  };

  if (error && allItems.length === 0) {
    if (renderError) {
      return <div style={{ height }}>{renderError(error, retry)}</div>;
    }
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
          <p style={{ color: "#666", fontSize: "0.9em" }}>{error.message}</p>
          <button onClick={retry} style={{ marginTop: 8, padding: "4px 12px", cursor: "pointer" }}>
            재시도
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
        <p>로딩 중...</p>
      </div>
    );
  }

  if (allItems.length === 0 && !hasMore) {
    if (renderEmpty) {
      return <div style={{ height }}>{renderEmpty()}</div>;
    }
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>데이터가 없습니다.</p>
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

