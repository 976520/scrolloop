import {
  useRef,
  useState,
  memo,
  useCallback,
  cloneElement,
  isValidElement,
} from "react";
import {
  ScrollView,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ViewStyle,
} from "react-native";
import type { VirtualListProps, ItemProps } from "../types";
import { calculateVirtualRange } from "@scrolloop/core";

export const VirtualList = memo<VirtualListProps>(
  ({
    count,
    itemSize,
    renderItem,
    height = 400,
    overscan = 4,
    style,
    onRangeChange,
    ...scrollViewProps
  }) => {
    const scrollTopRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const [, forceUpdate] = useState(0);
    const prevRangeRef = useRef<{ start: number; end: number }>({
      start: -1,
      end: -1,
    });

    const totalHeight = count * itemSize;

    const scrollTop = scrollTopRef.current;
    const prevScrollTop = prevScrollTopRef.current;

    const { renderStart: renderStartIndex, renderEnd: renderEndIndex } =
      calculateVirtualRange(
        scrollTop,
        height,
        itemSize,
        count,
        overscan,
        prevScrollTop
      );

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const newScrollTop = event.nativeEvent.contentOffset.y;

        prevScrollTopRef.current = scrollTopRef.current;
        scrollTopRef.current = newScrollTop;

        forceUpdate((prev) => prev + 1);
      },
      []
    );

    if (
      onRangeChange &&
      (prevRangeRef.current.start !== renderStartIndex ||
        prevRangeRef.current.end !== renderEndIndex)
    ) {
      prevRangeRef.current = {
        start: renderStartIndex,
        end: renderEndIndex,
      };
      onRangeChange({
        startIndex: renderStartIndex,
        endIndex: renderEndIndex,
      });
    }

    const items = [];
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
      const itemStyle: ViewStyle = {
        position: "absolute",
        top: i * itemSize,
        left: 0,
        right: 0,
        height: itemSize,
      };

      const itemContent = renderItem(i, itemStyle);

      if (isValidElement(itemContent)) {
        items.push(
          cloneElement(itemContent, {
            key: i,
          } as ItemProps)
        );
      }
    }

    return (
      <ScrollView
        {...scrollViewProps}
        style={[{ height }, style]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          style={{
            position: "relative",
            height: totalHeight,
            width: "100%",
          }}
        >
          {items}
        </View>
      </ScrollView>
    );
  }
);

VirtualList.displayName = "VirtualList";
