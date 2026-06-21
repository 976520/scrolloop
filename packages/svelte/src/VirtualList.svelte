<script lang="ts" generics="T">
  import { calculateVirtualRange } from "scrolloop";
  import type { Snippet } from "svelte";

  interface Props {
    count: number;
    itemSize: number;
    height?: number;
    overscan?: number;
    onRangeChange?: (range: { startIndex: number; endIndex: number }) => void;
    children: Snippet<[index: number, style: Record<string, string>]>;
  }

  let {
    count,
    itemSize,
    height = 400,
    overscan = 4,
    onRangeChange,
    children,
  }: Props = $props();

  let containerEl: HTMLDivElement | undefined = $state();
  let scrollTop = $state(0);
  let prevScrollTop = $state(0);

  const totalHeight = $derived(count * itemSize);

  const range = $derived(
    calculateVirtualRange(
      scrollTop,
      height,
      itemSize,
      count,
      overscan,
      prevScrollTop
    )
  );

  const virtualItems = $derived.by(() => {
    const items: Array<{ index: number; style: Record<string, string> }> = [];
    for (let i = range.renderStart; i <= range.renderEnd; i++) {
      items.push({
        index: i,
        style: {
          position: "absolute",
          top: `${i * itemSize}px`,
          left: "0",
          right: "0",
          height: `${itemSize}px`,
        },
      });
    }
    return items;
  });

  $effect(() => {
    onRangeChange?.({
      startIndex: range.renderStart,
      endIndex: range.renderEnd,
    });
  });

  $effect(() => {
    const el = containerEl;
    if (!el) return;

    let prev = el.scrollTop;

    function handleScroll() {
      const next = el.scrollTop;
      prevScrollTop = prev;
      scrollTop = next;
      prev = next;
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  });
</script>

<div
  bind:this={containerEl}
  role="list"
  style:overflow="auto"
  style:height="{height}px"
  style:position="relative"
>
  <div
    style:position="relative"
    style:height="{totalHeight}px"
    style:width="100%"
  >
    {#each virtualItems as item (item.index)}
      <div role="listitem">
        {@render children(item.index, item.style)}
      </div>
    {/each}
  </div>
</div>
