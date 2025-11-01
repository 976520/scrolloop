import { useEffect, useRef, useState, memo } from "react";
import type { VirtualListProps } from "./types";
import { clamp } from "./clamp";

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
    const [scrollTop, setScrollTop] = useState(0);
    const rafRef = useRef<number | null>(null);
    const prevRangeRef = useRef<{ start: number; end: number }>({
      start: -1,
      end: -1,
    });

    const totalHeight = count * itemSize;

    const startIndex = clamp(0, Math.floor(scrollTop / itemSize), count - 1);

    const renderStartIndex = Math.max(0, startIndex - overscan);
    const renderEndIndex = clamp(
      0,
      startIndex + Math.ceil(height / itemSize) + overscan * 2,
      count - 1
    );

    useEffect(() => {
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
    }, [renderStartIndex, renderEndIndex, onRangeChange]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        if (rafRef.current !== null) return;

        rafRef.current = requestAnimationFrame(() => {
          if (container) setScrollTop(container.scrollTop);
          rafRef.current = null;
        });
      };

      container.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        container.removeEventListener("scroll", handleScroll);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    const items = [];
    for (let i = renderStartIndex; i <= renderEndIndex; i++) {
      const itemStyle: React.CSSProperties = {
        position: "absolute",
        top: i * itemSize,
        left: 0,
        right: 0,
        height: itemSize,
      };

      items.push(
        <div key={i} role="listitem" style={itemStyle}>
          {renderItem(i, itemStyle)}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        role="list"
        className={className}
        style={{
          overflow: "auto",
          height,
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            height: totalHeight,
            width: "100%",
          }}
        >
          {items}
        </div>
      </div>
    );
  }
);

VirtualList.displayName = "VirtualList";

