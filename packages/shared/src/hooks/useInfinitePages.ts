import { useState, useCallback, useRef, useMemo } from "react";
import type { PageResponse } from "../types";
import { canLoadPage } from "../utils/canLoadPage";

interface UseInfinitePagesOptions<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  pageSize: number;
  initialPage: number;
  onPageLoad?: (page: number, items: T[]) => void;
  onError?: (error: Error) => void;
}

export function useInfinitePages<T>({
  fetchPage,
  pageSize,
  initialPage,
  onPageLoad,
  onError,
}: UseInfinitePagesOptions<T>) {
  const [pages, setPages] = useState<Map<number, T[]>>(new Map());
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  const allItems = useMemo(() => {
    const items: (T | undefined)[] = new Array(total);
    pages.forEach((pageItems, pageNum) => {
      const startIndex = pageNum * pageSize;
      pageItems.forEach((item, i) => {
        items[startIndex + i] = item;
      });
    });
    return items;
  }, [pages, total, pageSize]);

  const loadPage = useCallback(
    async (page: number) => {
      if (!canLoadPage(page, pages, loadingPages, total, pageSize, hasMore))
        return;

      setLoadingPages((prev) => new Set(prev).add(page));
      setError(null);

      const controller = new AbortController();
      abortControllersRef.current.set(page, controller);

      try {
        const response = await fetchPage(page, pageSize);

        if (controller.signal.aborted) return;

        setPages((prev) => new Map(prev).set(page, response.items));
        setTotal(response.total);
        setHasMore(response.hasMore);
        onPageLoad?.(page, response.items);
      } catch (err) {
        if (controller.signal.aborted) return;

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setLoadingPages((prev) => {
          const next = new Set(prev);
          next.delete(page);
          return next;
        });
        abortControllersRef.current.delete(page);
      }
    },
    [
      pages,
      loadingPages,
      hasMore,
      total,
      pageSize,
      fetchPage,
      onPageLoad,
      onError,
    ]
  );

  const retry = useCallback(() => {
    setError(null);
    loadPage(initialPage);
  }, [loadPage, initialPage]);

  const reset = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();

    setPages(new Map());
    setLoadingPages(new Set());
    setTotal(0);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    allItems,
    pages,
    loadingPages,
    total,
    hasMore,
    error,
    loadPage,
    retry,
    reset,
  };
}
