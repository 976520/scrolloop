// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { FixedLayoutStrategy } from "../FixedLayoutStrategy";
import { resetMaxElementSizeCache } from "../../../utils/getMaxElementSize";

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

    it("returns getVirtualSize equal to getTotalSize", () => {
      expect(strategy.getVirtualSize(COUNT)).toBe(strategy.getTotalSize(COUNT));
    });

    it("indexes items by raw division", () => {
      const range = strategy.getVisibleRange(500, 400, COUNT);
      expect(range.startIndex).toBe(10);
      expect(range.endIndex).toBe(18);
    });
  });

  describe("getItemOffset is stateless and absolute", () => {
    const ITEM_SIZE = 50;
    const strategy = new FixedLayoutStrategy(ITEM_SIZE);

    it("returns index * itemSize regardless of prior scroll calls", () => {
      strategy.getVisibleRange(500, 400, 1000);
      expect(strategy.getItemOffset(10)).toBe(500);
      strategy.getVisibleRange(9999, 400, 1000);
      expect(strategy.getItemOffset(10)).toBe(500);
    });

    it("is unaffected by clamping", () => {
      simulateBrowserCeiling(17_000_000);
      const big = new FixedLayoutStrategy(ITEM_SIZE);
      big.getVisibleRange(5_000_000, 800, 10_000_000);
      expect(big.getItemOffset(123_456)).toBe(123_456 * ITEM_SIZE);
    });

    it("returns identical values when called by separate consumers", () => {
      simulateBrowserCeiling(17_000_000);
      const shared = new FixedLayoutStrategy(ITEM_SIZE);
      shared.getVisibleRange(1_000_000, 800, 10_000_000);
      const a = shared.getItemOffset(50_000);
      shared.getVisibleRange(15_000_000, 800, 10_000_000);
      const b = shared.getItemOffset(50_000);
      expect(a).toBe(b);
    });
  });

  describe("above the browser ceiling", () => {
    const ITEM_SIZE = 50;
    const COUNT = 10_000_000;
    const VIEWPORT = 800;

    it("clamps getTotalSize to the probed browser maximum", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      const total = strategy.getTotalSize(COUNT);
      expect(total).toBeLessThan(ITEM_SIZE * COUNT);
      expect(total).toBeLessThanOrEqual(17_000_000);
    });

    it("keeps getVirtualSize unclamped", () => {
      simulateBrowserCeiling(17_000_000);
      const strategy = new FixedLayoutStrategy(ITEM_SIZE);
      expect(strategy.getVirtualSize(COUNT)).toBe(ITEM_SIZE * COUNT);
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

      const lastVirtualOffset = ITEM_SIZE * (HUGE_COUNT - 1);
      expect(lastVirtualOffset).toBeGreaterThan(2 ** 31);
      expect(range.startIndex).toBeGreaterThanOrEqual(0);
      expect(range.endIndex).toBe(HUGE_COUNT - 1);
    });
  });
});
