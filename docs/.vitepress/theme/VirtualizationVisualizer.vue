<script setup lang="ts">
import { ref, computed } from 'vue';

const itemCount = 100;
const itemSize = 32;
const visualizerHeight = 500;
const viewportHeight = 200;
const overscan = ref(2);

const scrollTop = ref(0);
const scrollContainer = ref<HTMLElement | null>(null);

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

const items = Array.from({ length: itemCount }, (_, i) => ({
  id: i,
  label: `Item ${i}`
}));

const centeringOffset = (visualizerHeight - viewportHeight) / 2;
const maxScrollTop = itemCount * itemSize - viewportHeight;
const innerScrollHeight = maxScrollTop + visualizerHeight;

const virtualRange = computed(() => {
  const start = Math.floor(scrollTop.value / itemSize);
  const end = Math.min(
    itemCount - 1,
    Math.floor((scrollTop.value + viewportHeight) / itemSize)
  );
  
  const renderStart = Math.max(0, start - overscan.value);
  const renderEnd = Math.min(itemCount - 1, end + overscan.value);
  
  return {
    start,
    end,
    renderStart,
    renderEnd
  };
});

const isItemRendered = (index: number) => {
  const { renderStart, renderEnd } = virtualRange.value;
  return index >= renderStart && index <= renderEnd;
};

const isItemInViewport = (index: number) => {
  const { start, end } = virtualRange.value;
  return index >= start && index <= end;
};

</script>

<template>
  <div class="visualizer-container">
    <div class="visualizer-header">
      <div class="header-section">
        <span class="label">all items</span>
      </div>
      <div class="header-section">
        <span class="label">only visible items</span>
      </div>
    </div>
    
    <div class="visualizer-main" :style="{ height: `${visualizerHeight}px` }">
      <div class="scroll-context" ref="scrollContainer" @scroll="handleScroll">
        <div :style="{ height: `${innerScrollHeight}px` }"></div>
      </div>

      <div class="panes-container">
        <div class="panes-wrapper">
          <div class="pane regular-pane">
            <div class="items-list" :style="{ transform: `translateY(${centeringOffset - scrollTop}px)` }">
              <div 
                v-for="item in items" 
                :key="item.id" 
                class="item regular-item"
                :style="{ height: `${itemSize - 6}px`, top: `${item.id * itemSize}px` }"
              >
                {{ item.label }}
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="pane virtual-pane">
            <div class="items-list" :style="{ transform: `translateY(${centeringOffset - scrollTop}px)` }">
              <div 
                v-for="(item, index) in items" 
                :key="item.id" 
                class="item"
                :class="{ 
                  'active': isItemInViewport(index),
                  'overscan': isItemRendered(index) && !isItemInViewport(index),
                  'ghosted': !isItemRendered(index)
                }"
                :style="{ height: `${itemSize - 6}px`, top: `${index * itemSize}px` }"
              >
                <span class="item-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="viewport-overlay" :style="{ height: `${viewportHeight}px`, top: `${centeringOffset}px` }">
          <div class="viewport-border top"></div>
          <div class="viewport-label-container">
            <span class="viewport-label">viewport</span>
          </div>
          <div class="viewport-border bottom"></div>
        </div>
      </div>
    </div>

    <div class="visualizer-footer">
      <div class="controls-left">
        <div class="control-group">
          <span class="control-label">overscan</span>
          <div class="slider-wrapper">
            <input 
              type="range" 
              min="0" 
              max="10" 
              v-model.number="overscan" 
              class="overscan-slider"
            />
            <span class="slider-value">{{ overscan }}</span>
          </div>
        </div>
      </div>
      <div class="controls-right">
        <div class="info-tag">
          <span class="tag-label">offset</span>
          <span class="tag-value">{{ Math.round(scrollTop) }}px</span>
        </div>
        <div class="info-tag highlight">
          <span class="tag-label">rendered</span>
          <span class="tag-value">{{ virtualRange.renderStart }}–{{ virtualRange.renderEnd }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visualizer-container {
  --brand-primary: #7c3aed;
  --bg-dark: #0f0f13;
  --bg-pane: #09090b;
  --bg-interface: #1a1a1e;
  --border-muted: rgba(255, 255, 255, 0.1);
  --text-muted: rgba(255, 255, 255, 0.4);
  
  background: var(--bg-dark);
  border: 1px solid var(--border-muted);
  border-radius: 12px;
  margin: 2.5rem 0;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  font-family: var(--vp-font-family-base);
  user-select: none;
}

/* Header */
.visualizer-header {
  display: flex;
  background: var(--bg-interface);
  border-bottom: 1px solid var(--border-muted);
  z-index: 10;
  position: relative;
}

.header-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
}

.header-section .label {
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot.regular { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
.dot.virtual { background: var(--brand-primary); box-shadow: 0 0 8px var(--brand-primary); }

/* Main Area */
.visualizer-main {
  position: relative;
  background: var(--bg-pane);
  overflow: hidden;
}

.scroll-context {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: scroll;
  z-index: 50; /* Above items, but below overlay for visual clarity if needed */
  opacity: 0;
}

.panes-container {
  position: relative;
  height: 100%;
}

.panes-wrapper {
  display: flex;
  height: 100%;
}

.pane {
  flex: 1;
  position: relative;
  padding: 0 20px;
}

.divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.02);
}

.items-list {
  position: relative;
  height: 100%;
  will-change: transform;
  transition: transform 0.1s linear;
}

.item {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.regular-item {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.item.active {
  background: var(--brand-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.item.overscan {
  background: rgba(124, 58, 237, 0.05);
  border: 1px dashed rgba(124, 58, 237, 0.3);
  color: #a78bfa;
}

.item.ghosted {
  opacity: 0.1;
  background: rgba(255, 255, 255, 0.02);
  color: white;
}

/* Viewport Overlay */
.viewport-overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  pointer-events: none;
  z-index: 5;
}

.viewport-border {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.viewport-border.top { top: 0; }
.viewport-border.bottom { bottom: 0; }

.viewport-border::before,
.viewport-border::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.viewport-border.top::before { left: 0; top: 0; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
.viewport-border.top::after { right: 0; top: 0; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
.viewport-border.bottom::before { left: 0; bottom: 0; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
.viewport-border.bottom::after { right: 0; bottom: 0; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

.viewport-label-container {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
  background: var(--bg-pane);
  padding: 4px 12px;
}

.viewport-label {
  font-size: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.3em;
  white-space: nowrap;
}

/* Footer & Slider */
.visualizer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: var(--bg-interface);
  border-top: 1px solid var(--border-muted);
  position: relative;
  z-index: 110;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.overscan-slider {
  width: 140px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  outline: none;
}

.overscan-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.overscan-slider::-webkit-slider-thumb:hover {
  transform: scale(1.25);
}

.slider-value {
  font-size: 12px;
  font-family: monospace;
  font-weight: 700;
  color: white;
  min-width: 20px;
}

.controls-right {
  display: flex;
  gap: 12px;
}

.info-tag {
  background: rgba(255, 255, 255, 0.03);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-tag.highlight {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.2);
}

.tag-label {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-muted);
}

.tag-value {
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  color: white;
}

.info-tag.highlight .tag-value {
  color: #a78bfa;
}

@media (max-width: 640px) {
  .visualizer-footer { flex-direction: column; gap: 16px; align-items: flex-start; }
}
</style>
