d
<script setup lang="ts" generic="T">
import { computed, onMounted } from "vue";
import { findMissingPages } from "scrolloop";
import type { PageResponse, Range } from "scrolloop";
import VirtualList from "./VirtualList.vue";
import { useInfinitePages } from "../composables/useInfinitePages";

const props = withDefaults(
  defineProps<{
    fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
    itemSize: number;
    pageSize?: number;
    initialPage?: number;
    prefetchThreshold?: number;
    height?: number;
    overscan?: number;
    class?: string;
  }>(),
  {
    pageSize: 20,
    initialPage: 0,
    prefetchThreshold: 1,
    height: 400,
  }
);

const emit = defineEmits<{
  pageLoad: [page: number, items: T[]];
  error: [error: Error];
}>();

const overscan = computed(
  () => props.overscan ?? Math.max(20, props.pageSize * 2)
);

const { pages, loadingPages, total, hasMore, error, loadPage, retry } =
  useInfinitePages<T>(() => ({
    fetchPage: props.fetchPage,
    pageSize: props.pageSize,
    initialPage: props.initialPage,
    onPageLoad: (page, items) => emit("pageLoad", page, items),
    onError: (err) => emit("error", err),
  }));

onMounted(() => {
  const needed = Math.ceil(props.height / props.itemSize) + overscan.value * 2;
  const count = Math.ceil(needed / props.pageSize) + props.prefetchThreshold;
  for (let p = 0; p < count; p++) loadPage(p);
});

function handleRangeChange(range: Range) {
  const ps = (range.startIndex / props.pageSize) | 0;
  const pe =
    ((range.endIndex / props.pageSize) | 0) +
    props.prefetchThreshold +
    Math.ceil(overscan.value / props.pageSize);
  const missingPages = findMissingPages(
    ps,
    pe,
    pages.value,
    loadingPages.value
  );
  for (const p of missingPages) loadPage(p);
}
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <template v-if="error && total === 0">
      <slot name="error" :error="error" :retry="retry">
        <div class="scrolloop-state-container">
          <div class="scrolloop-error-content">
            <p class="scrolloop-error-message">Error: {{ error.message }}</p>
            <button class="scrolloop-retry-button" @click="retry">Retry</button>
          </div>
        </div>
      </slot>
    </template>

    <template v-else-if="total === 0 && loadingPages.size">
      <slot name="loading">
        <div class="scrolloop-state-container">
          <p class="scrolloop-state-text">Loading...</p>
        </div>
      </slot>
    </template>

    <template v-else-if="total === 0 && !hasMore">
      <slot name="empty">
        <div class="scrolloop-state-container">
          <p class="scrolloop-state-text">No data.</p>
        </div>
      </slot>
    </template>

    <VirtualList
      v-else
      :count="total"
      :item-size="itemSize"
      :height="height"
      :overscan="overscan"
      :class="$props.class"
      @range-change="handleRangeChange"
    >
      <template #default="{ index, style }">
        <slot
          :item="
            pages.get(Math.floor(index / props.pageSize))?.[
              index % props.pageSize
            ]
          "
          :index="index"
          :style="style"
        />
      </template>
    </VirtualList>
  </div>
</template>

<style>
.scrolloop-state-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scrolloop-error-content {
  text-align: center;
}

.scrolloop-error-message {
  margin: 0 0 8px;
}

.scrolloop-retry-button {
  padding: 4px 12px;
  cursor: pointer;
}

.scrolloop-state-text {
  margin: 0;
}
</style>
