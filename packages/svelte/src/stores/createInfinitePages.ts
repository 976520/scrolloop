import { readable } from "svelte/store";
import { InfiniteSource } from "scrolloop";
import type { InfiniteSourceOptions, InfiniteSourceState } from "scrolloop";

export function createInfinitePages<T>(options: InfiniteSourceOptions<T>) {
  const source = new InfiniteSource(options);

  const store = readable<InfiniteSourceState<T>>(source.getState(), (set) => {
    const unsubscribe = source.subscribe(set);
    return () => {
      unsubscribe();
      source.destroy();
    };
  });

  return {
    subscribe: store.subscribe,
    loadPage: (page: number) => source.loadPage(page),
    retry: () => source.retry(),
    reset: () => source.reset(),
  };
}
