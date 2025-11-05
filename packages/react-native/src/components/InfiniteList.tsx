import { useEffect, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { InfiniteListProps } from "../types";
import { VirtualList } from "./VirtualList";
import { useInfinitePages, findMissingPages } from "@scrolloop/shared";

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
    style,
    renderLoading,
    renderError,
    renderEmpty,
    onPageLoad,
    onError,
    ...scrollViewProps
  } = props;

  const overscan = userOverscan ?? Math.max(20, pageSize * 2);

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

  const handleRangeChange = (range: {
    startIndex: number;
    endIndex: number;
  }) => {
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
  };

  if (error && allItems.length === 0) {
    if (renderError) {
      return (
        <View style={[{ height }, style]}>{renderError(error, retry)}</View>
      );
    }
    return (
      <View
        style={[
          {
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <View style={{ alignItems: "center" }}>
          <Text>Error.</Text>
          <Text style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={retry}
            style={{ marginTop: 8, paddingVertical: 4, paddingHorizontal: 12 }}
          >
            <Text>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (allItems.length === 0 && loadingPages.size > 0) {
    if (renderLoading) {
      return <View style={[{ height }, style]}>{renderLoading()}</View>;
    }
    return (
      <View
        style={[
          {
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  if (allItems.length === 0 && !hasMore) {
    if (renderEmpty) {
      return <View style={[{ height }, style]}>{renderEmpty()}</View>;
    }
    return (
      <View
        style={[
          {
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <Text>No data.</Text>
      </View>
    );
  }

  return (
    <VirtualList
      {...scrollViewProps}
      count={allItems.length}
      itemSize={itemSize}
      height={height}
      overscan={overscan}
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
