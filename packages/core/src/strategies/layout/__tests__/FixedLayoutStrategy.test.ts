// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { FixedLayoutStrategy } from "../FixedLayoutStrategy";
import { resetMaxElementSizeCache } from "../../../utils/getMaxElementSize";

describe("FixedLayoutStrategy", () => {
  beforeEach(() => {
    resetMaxElementSizeCache();
    HTMLElement.prototype.getBoundingClientRect = function () {
      const declared = parseFloat(this.style.height || "0");
      return {
        x: 0,
        y: 0,
        width: 1,
        height: declared,
        top: 0,
        left: 0,
        right: 1,
        bottom: declared,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });

  describe("below the browser ceiling", () => {
    const ITEM_SIZE = 50;
    const COUNT = 1000;
    const strategy = new FixedLayoutStrategy(ITEM_SIZE);

    it("returns virtual total size unchanged", () => {
      expect(strategy.getTotalSize(COUNT)).toBe(ITEM_SIZE * COUNT);
    });

    it("indexes items by raw division", () => {
      const range = strategy.getVisibleRange(500, 400, COUNT);
      expect(range.startIndex).toBe(10);
      expect(range.endIndex).toBe(18);
    });

    it("returns item offsets in virtual coordinates", () => {
      strategy.getVisibleRange(500, 400, COUNT);
      expect(strategy.getItemOffset(10)).toBe(500);
      expect(strategy.getItemOffset(11)).toBe(550);
    });
  });

  describe("above the browser ceiling", () => {
    const ITEM_SIZE = 50;
    const COUNT = 10_000_000;
    const VIEWPORT = 800;

    function simulateBrowserCeiling(limit: number) {
      HTMLElement.prototype.getBoundingClientRect = function () {
        const declared = parseFloat(this.style.height || "0");
        const clamped = Math.min(declared, limit);
        return {
          x: 0,
          y: 0,
          width: 1,
          height: clamped,
          top: 0,
          left: 0,
          right: 1,
          bottom: clamped,
          toJSON: () => ({}),
        } as DOMRect;
      };
    }

    it("clamps total size to the probed browser maximum", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const total = strategy.getTotalSize(COUNT);
      expect(total).toBeLessThan(ITEM_SIZE * COUNT);
      expect(total).toBeLessThanOrEqual(17_000_000);
    });

    it("maps scroll positions to the full virtual range", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const clampedTotal = strategy.getTotalSize(COUNT);

      const startRange = strategy.getVisibleRange(0, VIEWPORT, COUNT);
      expect(startRange.startIndex).toBe(0);

      const endRange = strategy.getVisibleRange(
        clampedTotal - VIEWPORT,
        VIEWPORT,
        COUNT
      );
      expect(endRange.endIndex).toBe(COUNT - 1);
    });

    it("positions items near the current scroll offset", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const clampedTotal = strategy.getTotalSize(COUNT);
      const scrollOffset = clampedTotal / 2;

      const range = strategy.getVisibleRange(scrollOffset, VIEWPORT, COUNT);
      const firstOffset = strategy.getItemOffset(range.startIndex);

      expect(firstOffset).toBeGreaterThanOrEqual(scrollOffset - ITEM_SIZE);
      expect(firstOffset).toBeLessThan(scrollOffset + VIEWPORT);
    });

    it("keeps consecutive items spaced by itemSize", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const clampedTotal = strategy.getTotalSize(COUNT);

      const range = strategy.getVisibleRange(clampedTotal / 3, VIEWPORT, COUNT);
      const a = strategy.getItemOffset(range.startIndex);
      const b = strategy.getItemOffset(range.startIndex + 1);
      expect(b - a).toBeCloseTo(ITEM_SIZE, 5);
    });

    it("produces correct indices when virtual offset exceeds 2^31", () => {
      simulateBrowserCeiling(17_000_000);
      const HUGE_COUNT = 200_000_000;
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const clampedTotal = strategy.getTotalSize(HUGE_COUNT);

      const range = strategy.getVisibleRange(
        clampedTotal - VIEWPORT,
        VIEWPORT,
        HUGE_COUNT
      );

      const virtualOffset = ITEM_SIZE * (HUGE_COUNT - 1);
      expect(virtualOffset).toBeGreaterThan(2 ** 31);
      expect(range.startIndex).toBeGreaterThanOrEqual(0);
      expect(range.endIndex).toBe(HUGE_COUNT - 1);
    });
  });
});
