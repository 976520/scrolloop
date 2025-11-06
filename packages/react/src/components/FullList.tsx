import { memo, forwardRef, useMemo, type CSSProperties } from "react";
import type { FullListProps } from "../types";

const FullListInner = <T,>(
  props: FullListProps<T>,
  ref: React.Ref<HTMLDivElement>
) => {
  const {
    items,
    renderItem,
    itemSize,
    height = 400,
    className,
    style,
    "data-ssr-list": dataSSRList = true,
  } = props;

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      overflow: "auto",
      height,
      ...style,
    }),
    [height, style]
  );

  const itemElements = useMemo(() => {
    return items.map((item, index) => {
      const itemStyle: CSSProperties = {
        height: itemSize,
        minHeight: itemSize,
      };

      const content = renderItem(item, index, itemStyle);

      return (
        <div
          key={index}
          data-item-index={index}
          data-ssr-item={true}
          style={itemStyle}
        >
          {content}
        </div>
      );
    });
  }, [items, renderItem, itemSize]);

  return (
    <div
      ref={ref}
      className={className}
      style={containerStyle}
      data-ssr-list={dataSSRList}
      role="list"
    >
      {itemElements}
    </div>
  );
};

const FullListWithRef = forwardRef(FullListInner) as <T>(
  props: FullListProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => JSX.Element;

export const FullList = Object.assign(memo(FullListWithRef), {
  displayName: "FullList",
}) as typeof FullListWithRef & { displayName: string };
