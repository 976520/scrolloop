import {
  useEffect,
  useRef,
  useState,
  memo,
  useCallback,
  useMemo,
  cloneElement,
  isValidElement,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import type { VirtualListProps, ItemProps } from "../types";
import { calculateVirtualRange } from "@scrolloop/core";

export const VirtualList = memo<VirtualListProps>(
  ({
    count,
    itemSize,
    renderItem,
    height = 400,
    overscan = 4,
    className,
    style,
    onRangeChange,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollTopRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const onRangeChangeRef = useRef(onRangeChange);
    const [, forceUpdate] = useState(0);
    const prevRangeRef = useRef<{ start: number; end: number }>({
      start: -1,
      end: -1,
    });

    useEffect(() => {
      onRangeChangeRef.current = onRangeChange;
    }, [onRangeChange]);

    const totalHeight = useMemo(() => count * itemSize, [count, itemSize]);

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

    useEffect(() => {
      if (
        onRangeChangeRef.current &&
        (prevRangeRef.current.start !== renderStartIndex ||
          prevRangeRef.current.end !== renderEndIndex)
      ) {
        prevRangeRef.current = {
          start: renderStartIndex,
          end: renderEndIndex,
        };
        onRangeChangeRef.current({
          startIndex: renderStartIndex,
          endIndex: renderEndIndex,
        });
      }
    }, [renderStartIndex, renderEndIndex]);

    const handleScroll = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      prevScrollTopRef.current = scrollTopRef.current;
      scrollTopRef.current = container.scrollTop;

      flushSync(() => {
        forceUpdate((prev) => prev + 1);
      });
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }, [handleScroll]);

    const items = useMemo(() => {
      const result = [];
      for (let i = renderStartIndex; i <= renderEndIndex; i++) {
        const itemStyle: CSSProperties = {
          position: "absolute",
          top: i * itemSize,
          left: 0,
          right: 0,
          height: itemSize,
        };

        const itemContent = renderItem(i, itemStyle);

        if (isValidElement(itemContent)) {
          result.push(
            cloneElement(itemContent, {
              key: i,
              role: "listitem",
            } as ItemProps)
          );
        }
      }
      return result;
    }, [renderStartIndex, renderEndIndex, itemSize, renderItem]);

    const containerStyle = useMemo<CSSProperties>(
      () => ({
        overflow: "auto",
        height,
        ...style,
      }),
      [height, style]
    );

    const innerStyle = useMemo<CSSProperties>(
      () => ({
        position: "relative",
        height: totalHeight,
        width: "100%",
      }),
      [totalHeight]
    );

    return (
      <div
        ref={containerRef}
        role="list"
        className={className}
        style={containerStyle}
      >
        <div style={innerStyle}>{items}</div>
      </div>
    );
  }
);

VirtualList.displayName = "VirtualList";
