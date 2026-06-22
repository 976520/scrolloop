<script lang="ts" generics="T">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { createInfinitePages } from "./stores/createInfinitePages";
  import VirtualList from "./VirtualList.svelte";
  import { findMissingPages } from "scrolloop";
  import type { InfiniteSourceOptions } from "scrolloop";

  interface Props {
    fetchPage: InfiniteSourceOptions<T>["fetchPage"];
    pageSize?: number;
    initialPage?: number;
    prefetchThreshold?: number;
    itemSize: number;
    height?: number;
    overscan?: number;
    children: Snippet<
      [index: number, item: T | undefined, style: Record<string, string>]
    >;
    error?: Snippet<[err: Error, retry: () => void]>;
    loading?: Snippet;
    empty?: Snippet;
  }

  let {
    fetchPage,
    pageSize = 20,
    initialPage = 0,
    prefetchThreshold = 1,
    itemSize,
    height = 400,
    overscan,
    children,
    error: errorSnippet,
    loading: loadingSnippet,
    empty: emptySnippet,
  }: Props = $props();

  const source = createInfinitePages<T>({ fetchPage, pageSize, initialPage });

  const total = $derived($source.total);
  const pages = $derived($source.pages);
  const loadingPages = $derived($source.loadingPages);
  const errorState = $derived($source.error);
  const hasMore = $derived($source.hasMore);

  const effectiveOverscan = $derived(overscan ?? Math.max(20, pageSize * 2));

  onMount(() => {
    const needed = Math.ceil(height / itemSize) + effectiveOverscan * 2;
    const pagesToLoad = Math.ceil(needed / pageSize);
    for (let p = 0; p < pagesToLoad; p++) {
      source.loadPage(p);
    }
  });

  function handleRangeChange(range: { startIndex: number; endIndex: number }) {
    const ps = (range.startIndex / pageSize) | 0;
    const pe = ((range.endIndex / pageSize) | 0) + prefetchThreshold;
    const missingPages = findMissingPages(ps, pe, pages, loadingPages);
    for (const p of missingPages) {
      source.loadPage(p);
    }
  }
</script>

{#if errorState && total === 0}
  {#if errorSnippet}
    {@render errorSnippet(errorState, source.retry)}
  {:else}
    <div class="scrolloop-state-container" style:height="{height}px">
      <div class="scrolloop-error-content">
        <p class="scrolloop-error-message">Error.</p>
        <p class="scrolloop-error-detail">{errorState.message}</p>
        <button class="scrolloop-retry-button" onclick={source.retry}
          >Retry</button
        >
      </div>
    </div>
  {/if}
{:else if total === 0 && loadingPages.size > 0}
  {#if loadingSnippet}
    <div style:height="{height}px">{@render loadingSnippet()}</div>
  {:else}
    <div class="scrolloop-state-container" style:height="{height}px">
      <p class="scrolloop-state-text">Loading...</p>
    </div>
  {/if}
{:else if total === 0 && !hasMore}
  {#if emptySnippet}
    <div style:height="{height}px">{@render emptySnippet()}</div>
  {:else}
    <div class="scrolloop-state-container" style:height="{height}px">
      <p class="scrolloop-state-text">No data.</p>
    </div>
  {/if}
{:else}
  <VirtualList
    count={total}
    {itemSize}
    {height}
    overscan={effectiveOverscan}
    onRangeChange={handleRangeChange}
  >
    {#snippet children(index, style)}
      {@render children(
        index,
        pages.get(Math.floor(index / pageSize))?.[index % pageSize],
        style
      )}
    {/snippet}
  </VirtualList>
{/if}

<style>
  :global(.scrolloop-state-container) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.scrolloop-error-content) {
    text-align: center;
  }

  :global(.scrolloop-error-message) {
    margin: 0 0 4px;
  }

  :global(.scrolloop-error-detail) {
    margin: 0 0 8px;
    color: #666;
    font-size: 0.9em;
  }

  :global(.scrolloop-retry-button) {
    padding: 4px 12px;
    cursor: pointer;
  }

  :global(.scrolloop-state-text) {
    margin: 0;
  }
</style>
