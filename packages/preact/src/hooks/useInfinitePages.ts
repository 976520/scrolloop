import { useState, useCallback, useEffect } from "preact/hooks";
import { InfiniteSource } from "@scrolloop/shared";
import type {
  InfiniteSourceState,
  InfiniteSourceOptions,
} from "@scrolloop/shared";

export function useInfinitePages<T>(options: InfiniteSourceOptions<T>) {
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
