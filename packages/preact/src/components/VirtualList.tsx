import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "preact/hooks";
import type { CSSProperties } from "preact";
import { calculateVirtualRange } from "@scrolloop/core";
import type { VirtualListProps } from "../types";

export function VirtualList({
  count,
  itemSize,
  renderItem,
  height = 400,
  overscan = 4,
  class: className,
  style,
  onRangeChange,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const onRangeChangeRef = useRef(onRangeChange);
  const [, forceUpdate] = useState(0);
  const prevRangeRef = useRef({ start: -1, end: -1 });

  useEffect(() => {
    onRangeChangeRef.current = onRangeChange;
  }, [onRangeChange]);

  const totalHeight = count * itemSize;

  const { renderStart, renderEnd } = calculateVirtualRange(
    scrollTopRef.current,
    height,
    itemSize,
    count,
    overscan,
    prevScrollTopRef.current
  );

  useEffect(() => {
    const cb = onRangeChangeRef.current;
    if (
      cb &&
      (prevRangeRef.current.start !== renderStart ||
        prevRangeRef.current.end !== renderEnd)
    ) {
      prevRangeRef.current = { start: renderStart, end: renderEnd };
      cb({ startIndex: renderStart, endIndex: renderEnd });
    }
  }, [renderStart, renderEnd]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    prevScrollTopRef.current = scrollTopRef.current;
    scrollTopRef.current = el.scrollTop;
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const items = useMemo(() => {
    const result = [];
    for (let i = renderStart; i <= renderEnd; i++) {
      const itemStyle: CSSProperties = {
        position: "absolute",
        top: i * itemSize,
        left: 0,
        right: 0,
        height: itemSize,
      };
      result.push(
        <div key={i} role="listitem">
          {renderItem(i, itemStyle)}
        </div>
      );
    }
    return result;
  }, [renderStart, renderEnd, itemSize, renderItem]);

  const containerStyle: CSSProperties = {
    overflow: "auto",
    height,
    ...style,
  };

  return (
    <div
      ref={containerRef}
      role="list"
      class={className}
      style={containerStyle}
    >
      <div style={{ position: "relative", height: totalHeight, width: "100%" }}>
        {items}
      </div>
    </div>
  );
}
