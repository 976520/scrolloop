<script setup>
import { ref, computed } from "vue";

const items = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  text: `item #${i}`,
}));
const containerHeight = 400;
const itemHeight = 48;
const scrollTop = ref(0);

const onScroll = (e) => {
  scrollTop.value = e.target.scrollTop;
};

const totalHeight = items.length * itemHeight;

const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight));
const endIndex = computed(() =>
  Math.min(
    items.length,
    Math.ceil((scrollTop.value + containerHeight) / itemHeight) + 1
  )
);

const visibleItems = computed(() => {
  return items.slice(startIndex.value, endIndex.value).map((item) => ({
    ...item,
    top: item.id * itemHeight,
  }));
});

const getTransform = (top) => `translateY(${top}px)`;

const highlight = {
  tag: (content) => `<span class="token tag">${content}</span>`,
  attr: (name) => `<span class="token attr-name">${name}</span>`,
  val: (value) => `<span class="token attr-value">"${value}"</span>`,
  punc: (char) => `<span class="token punctuation">${char}</span>`,
  text: (content) => `<span class="token text">${content}</span>`,
};

const codeLines = computed(() => {
  const lines = [];

  const viewportAttrs = `${highlight.attr("class")}=${highlight.val("viewport")} ${highlight.attr("style")}=${highlight.val(`overflow: auto; height: ${containerHeight}px;`)}`;
  lines.push({
    id: "vp-start",
    html: `${highlight.punc("<")}${highlight.tag("div")} ${viewportAttrs}${highlight.punc(">")}`,
  });

  const rendererAttrs = `${highlight.attr("class")}=${highlight.val("swappable-renderer")} ${highlight.attr("style")}=${highlight.val(`height: ${totalHeight}px; position: relative;`)}`;
  lines.push({
    id: "rd-start",
    html: `  ${highlight.punc("<")}${highlight.tag("div")} ${rendererAttrs}${highlight.punc(">")}`,
  });

  visibleItems.value.forEach((item) => {
    const itemAttrs =
      `${highlight.attr("class")}=${highlight.val("item")} ` +
      `${highlight.attr("style")}=${highlight.val(
        `height: 48px; transform: translateY(${item.top}px);`
      )}`;

    lines.push({
      id: `item-${item.id}`,
      html:
        `    ${highlight.punc("<")}${highlight.tag("div")} ${itemAttrs}${highlight.punc(">")}` +
        `${highlight.text(item.text)}` +
        `${highlight.punc("<")}` +
        `${highlight.punc("/")}` +
        `${highlight.tag("div")}` +
        `${highlight.punc(">")}`,
      isItem: true,
    });
  });

  lines.push({
    id: "rd-end",
    html:
      `  ${highlight.punc("<")}` +
      `${highlight.punc("/")}` +
      `${highlight.tag("div")}` +
      `${highlight.punc(">")}`,
  });

  lines.push({
    id: "vp-end",
    html:
      `${highlight.punc("<")}` +
      `${highlight.punc("/")}` +
      `${highlight.tag("div")}` +
      `${highlight.punc(">")}`,
  });

  return lines;
});
</script>

<template>
  <section class="demo-section" id="demo">
    <div class="demo-container">
      <h2 class="demo-title animate-on-scroll fade-up">See it in Action</h2>
      <p class="demo-subtitle animate-on-scroll fade-up delay-100">
        O(visible items) rendering. Not O(n).
      </p>

      <div class="demo-playground animate-on-scroll fade-up delay-200">
        <!-- Real Virtual Scroll View -->
        <div class="demo-card glass">
          <div class="card-header">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="header-text">Virtual List</span>
          </div>
          <div
            class="virtual-scroll-viewport"
            :style="{ height: containerHeight + 'px' }"
            @scroll="onScroll"
          >
            <div
              class="virtual-scroll-renderer"
              :style="{ height: totalHeight + 'px' }"
            >
              <div
                v-for="item in visibleItems"
                :key="item.id"
                class="virtual-item"
                :style="{
                  height: itemHeight + 'px',
                  transform: getTransform(item.top),
                }"
              >
                {{ item.text }}
              </div>
            </div>
          </div>
        </div>

        <div class="demo-card glass dom-viewer">
          <div class="card-header">
            <span class="header-text">Inspector (DOM)</span>
            <div class="dom-stats">Nodes: {{ visibleItems.length + 2 }}</div>
          </div>
          <div
            class="code-viewer"
            :style="{ height: containerHeight + 'px' }"
          >
            <div
              v-for="line in codeLines"
              :key="line.id"
              class="code-line"
              :class="{ 'pulse-bg': line.isItem }"
              v-html="line.html"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-section {
  padding: 8rem 2rem;
  position: relative;
  z-index: 2;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;

  color: #09090b; 
  text-shadow:
    1px 0 0 #fff,
   -1px 0 0 #fff,
    0 1px 0 #fff,
    0 -1px 0 #fff,
    1px 1px 0 #fff,
   -1px 1px 0 #fff,
    1px -1px 0 #fff,
   -1px -1px 0 #fff;
}

.demo-subtitle {
  font-size: 1.25rem;
  color: #a1a1aa;
  text-align: center;
  margin-bottom: 4rem;
  line-height: 2.4;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.demo-playground {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.demo-card {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  background: rgba(15, 15, 20, 0.7);
  backdrop-filter: blur(12px);
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
}

.demo-card:hover {
  border-color: rgba(102, 126, 234, 0.3);
}

.card-header {
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #efeff1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-left: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.red {
  background: #ff5f56;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #27c93f;
}

.virtual-scroll-viewport {
  overflow-y: auto;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
}

.virtual-scroll-viewport::-webkit-scrollbar,
.code-viewer::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-viewport::-webkit-scrollbar-track,
.code-viewer::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroll-viewport::-webkit-scrollbar-thumb,
.code-viewer::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.virtual-scroll-viewport::-webkit-scrollbar-thumb:hover,
.code-viewer::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.virtual-item {
  position: absolute;
  left: 0;
  width: 100%;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-weight: 500;
  color: #d1d1d6;
  font-size: 0.95rem;
}

.virtual-item:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #fff;
}

.dom-viewer {
  background: rgba(10, 10, 15, 0.8) !important;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.dom-stats {
  margin-left: auto;
  font-size: 0.75rem;
  font-family: "Noto Sans", sans-serif;
  color: #6b7280;
}

.code-viewer {
  padding: 1rem;
  font-family: "Fira Code", monospace;
  font-size: 10px;
  line-height: 1.8;
  overflow: auto;
}

.code-line {
  white-space: pre;
  transition: background 0.3s ease;
  border-radius: 2px;
  padding: 0 0.5rem;
}

.code-line.pulse-bg {
  animation: flash 0.8s ease-out;
}

@keyframes flash {
  0% {
    background-color: rgba(255, 255, 255, 0.2);
  }
  100% {
    background-color: transparent;
  }
}

@media (max-width: 1024px) {
  .demo-playground {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .demo-section {
    padding: 4rem 1rem;
  }
}

.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.animate-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

.delay-100 {
  transition-delay: 0.1s;
}
.delay-200 {
  transition-delay: 0.2s;
}

.fade-up {
  transform: translateY(40px);
}
</style>
