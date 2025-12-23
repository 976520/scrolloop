import { describe, it, expect } from "vitest";
import { calculateVirtualRange } from "../calculateVirtualRange";

describe("calculateVirtualRange", () => {
  const defaultParams = {
    viewportSize: 400,
    itemSize: 50,
    totalCount: 100,
    overscan: 2,
  };

  it("calculates correct range for initial scroll position", () => {
    const result = calculateVirtualRange(
      0,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(8);
    expect(result.renderStart).toBe(0);
    expect(result.renderEnd).toBeGreaterThanOrEqual(8);
  });

  it("calculates correct range for middle scroll position", () => {
    const scrollOffset = 500;
    const result = calculateVirtualRange(
      scrollOffset,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(10);
    expect(result.endIndex).toBe(18);
    expect(result.renderStart).toBeLessThanOrEqual(10);
    expect(result.renderEnd).toBeGreaterThanOrEqual(18);
  });

  it("calculates correct range for end scroll position", () => {
    const scrollOffset = 4500;
    const result = calculateVirtualRange(
      scrollOffset,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(90);
    expect(result.endIndex).toBe(98);
    expect(result.renderStart).toBeLessThanOrEqual(90);
    expect(result.renderEnd).toBe(99);
  });

  it("handles overscan correctly when scrolling down", () => {
    const scrollOffset = 500;
    const prevScrollOffset = 400;
    const result = calculateVirtualRange(
      scrollOffset,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan,
      prevScrollOffset
    );

    expect(result.renderEnd).toBeGreaterThan(result.endIndex);
  });

  it("handles overscan correctly when scrolling up", () => {
    const scrollOffset = 400;
    const prevScrollOffset = 500;
    const result = calculateVirtualRange(
      scrollOffset,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan,
      prevScrollOffset
    );

    expect(result.renderStart).toBeLessThan(result.startIndex);
  });

  it("clamps startIndex to 0", () => {
    const result = calculateVirtualRange(
      -100,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.renderStart).toBe(0);
  });

  it("clamps endIndex to totalCount - 1", () => {
    const scrollOffset = 10000;
    const result = calculateVirtualRange(
      scrollOffset,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.endIndex).toBe(99);
    expect(result.renderEnd).toBe(99);
  });

  it("handles empty list", () => {
    const result = calculateVirtualRange(
      0,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      0,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(-1);
    expect(result.renderStart).toBe(0);
    expect(result.renderEnd).toBe(-1);
  });

  it("handles single item", () => {
    const result = calculateVirtualRange(
      0,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      1,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
    expect(result.renderStart).toBe(0);
    expect(result.renderEnd).toBe(0);
  });

  it("handles small viewport", () => {
    const result = calculateVirtualRange(
      0,
      50,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(1);
    expect(result.renderStart).toBe(0);
    expect(result.renderEnd).toBeGreaterThanOrEqual(1);
  });

  it("handles large item size", () => {
    const result = calculateVirtualRange(
      0,
      400,
      200,
      10,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(2);
    expect(result.renderStart).toBe(0);
    expect(result.renderEnd).toBeLessThanOrEqual(9);
  });

  it("handles zero overscan", () => {
    const result = calculateVirtualRange(
      500,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      0
    );

    expect(result.renderStart).toBe(result.startIndex);
    expect(result.renderEnd).toBe(result.endIndex);
  });

  it("handles large overscan", () => {
    const result = calculateVirtualRange(
      500,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      10
    );

    expect(result.renderStart).toBeLessThan(result.startIndex);
    expect(result.renderEnd).toBeGreaterThan(result.endIndex);
  });

  it("handles fractional scroll offsets", () => {
    const result = calculateVirtualRange(
      123.45,
      defaultParams.viewportSize,
      defaultParams.itemSize,
      defaultParams.totalCount,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(2);
    expect(result.endIndex).toBeGreaterThanOrEqual(2);
  });

  it("handles fractional item sizes", () => {
    const result = calculateVirtualRange(
      0,
      400,
      33.33,
      100,
      defaultParams.overscan
    );

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBeGreaterThanOrEqual(0);
    expect(result.renderStart).toBe(0);
  });
});
