import { hydrateRoot } from "react-dom/client";
import { InfiniteList } from "../../components/InfiniteList";
import type { PageResponse } from "../../types";

const initialData = Array(50)
  .fill(0)
  .map((_, i) => ({ id: i, name: `Item ${i}` }));

const fetchPage = async (
  page: number,
  size: number
): Promise<PageResponse<{ id: number; name: string }>> => {
  const start = page * size;
  const end = start + size;
  return {
    items: initialData.slice(start, end),
    total: initialData.length,
    hasMore: end < initialData.length,
  };
};

hydrateRoot(
  document.getElementById("root")!,
  <InfiniteList
    fetchPage={fetchPage}
    renderItem={(item, index, style) => (
      <div data-testid={`item-${index}`} data-ssr-item={true} style={style}>
        {item ? item.name : "Loading..."}
      </div>
    )}
    itemSize={50}
    height={400}
    pageSize={20}
    isServerSide={true}
    initialData={initialData}
    initialTotal={initialData.length}
  />
);
