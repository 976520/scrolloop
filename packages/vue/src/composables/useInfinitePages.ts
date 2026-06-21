import { ref, computed, watch, toValue, onUnmounted } from "vue";
import type { MaybeRefOrGetter } from "vue";
import { InfiniteSource } from "@scrolloop/core";
import type { InfiniteSourceOptions } from "@scrolloop/core";

export function useInfinitePages<T>(
  options: MaybeRefOrGetter<InfiniteSourceOptions<T>>
) {
  const resolved = toValue(options);
  const source = new InfiniteSource(resolved);
  const state = ref(source.getState());

  const unsubscribe = source.subscribe((s) => {
    state.value = s;
  });

  watch(
    () => {
      const { fetchPage, onPageLoad, onError } = toValue(options);
      return { fetchPage, onPageLoad, onError };
    },
    ({ fetchPage, onPageLoad, onError }) => {
      source.updateCallbacks({ fetchPage, onPageLoad, onError });
    }
  );

  onUnmounted(() => {
    unsubscribe();
    source.destroy();
  });

  return {
    pages: computed(() => state.value.pages),
    loadingPages: computed(() => state.value.loadingPages),
    total: computed(() => state.value.total),
    hasMore: computed(() => state.value.hasMore),
    error: computed(() => state.value.error),
    loadPage: (page: number) => source.loadPage(page),
    retry: () => source.retry(),
    reset: () => source.reset(),
  };
}
