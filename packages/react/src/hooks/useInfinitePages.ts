import { useState, useCallback, useEffect } from "react";
import { InfiniteSource } from "@scrolloop/core";
import type {
  InfiniteSourceState,
  InfiniteSourceOptions,
} from "@scrolloop/core";

export function useInfinitePages<T>(
  options: InfiniteSourceOptions<T>
): InfiniteSourceState<T> & {
  loadPage: (page: number) => Promise<void>;
  retry: () => void;
  reset: () => void;
} {
  const { fetchPage, pageSize, initialPage, onPageLoad, onError } = options;

  const [manager] = useState<InfiniteSource<T>>(
    () =>
      new InfiniteSource({
        fetchPage,
        pageSize,
        initialPage,
        onPageLoad,
        onError,
      })
  );

  const [state, setState] = useState<InfiniteSourceState<T>>(() =>
    manager.getState()
  );

  useEffect(() => {
    const unsubscribe = manager.subscribe(setState);
    return () => {
      unsubscribe();
      manager.destroy();
    };
  }, [manager]);

  useEffect(() => {
    manager.updateCallbacks({ fetchPage, onPageLoad, onError });
  }, [manager, fetchPage, onPageLoad, onError]);

  const loadPage = useCallback(
    (page: number) => manager.loadPage(page),
    [manager]
  );
  const retry = useCallback(() => manager.retry(), [manager]);
  const reset = useCallback(() => manager.reset(), [manager]);

  return { ...state, loadPage, retry, reset };
}
