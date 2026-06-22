<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { calculateVirtualRange } from "scrolloop";
import type { Range } from "scrolloop";

const props = withDefaults(
  defineProps<{
    count: number;
    itemSize: number;
    height?: number;
    overscan?: number;
    class?: string;
  }>(),
  { height: 400, overscan: 4 }
);

const emit = defineEmits<{
  rangeChange: [range: Range];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const scrollTop = ref(0);
const prevScrollTop = ref(0);

const totalHeight = computed(() => props.count * props.itemSize);

const range = computed(() =>
  calculateVirtualRange(
    scrollTop.value,
    props.height,
    props.itemSize,
    props.count,
    props.overscan,
    prevScrollTop.value
  )
);

const virtualItems = computed(() => {
  const items: Array<{ index: number; style: Record<string, string> }> = [];
  for (let i = range.value.renderStart; i <= range.value.renderEnd; i++) {
    items.push({
      index: i,
      style: {
        position: "absolute",
        top: `${i * props.itemSize}px`,
        left: "0",
        right: "0",
        height: `${props.itemSize}px`,
      },
    });
  }
  return items;
});

watch(range, (r) => {
  emit("rangeChange", { startIndex: r.renderStart, endIndex: r.renderEnd });
});

function handleScroll() {
  const el = containerRef.value;
  if (!el) return;
  prevScrollTop.value = scrollTop.value;
  scrollTop.value = el.scrollTop;
}

onMounted(() => {
  containerRef.value?.addEventListener("scroll", handleScroll, {
    passive: true,
  });
});

onUnmounted(() => {
  containerRef.value?.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    ref="containerRef"
    role="list"
    :class="$props.class"
    :style="{ overflow: 'auto', height: `${height}px` }"
  >
    <div
      :style="{
        position: 'relative',
        height: `${totalHeight}px`,
        width: '100%',
      }"
    >
      <template v-for="item in virtualItems" :key="item.index">
        <slot :index="item.index" :style="item.style" />
      </template>
    </div>
  </div>
</template>
