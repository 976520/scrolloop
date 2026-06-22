import { describe, it, expect } from "vitest";
import { mapToVirtualOffset } from "../mapToVirtualOffset";

describe("mapToVirtualOffset", () => {
  it("returns scrollOffset unchanged when not clamped", () => {
    expect(mapToVirtualOffset(123, 800, 5000, 5000)).toBe(123);
    expect(mapToVirtualOffset(0, 800, 5000, 10_000)).toBe(0);
  });

  it("returns 0 when the rendered scrollable range is zero or negative", () => {
    expect(mapToVirtualOffset(50, 1000, 100_000, 1000)).toBe(0);
    expect(mapToVirtualOffset(50, 1000, 100_000, 500)).toBe(0);
  });

  it("maps endpoints correctly", () => {
    const clamped = 17_000_000;
    const virtual = 500_000_000;
    const viewport = 800;

    expect(mapToVirtualOffset(0, viewport, virtual, clamped)).toBe(0);
    expect(
      mapToVirtualOffset(clamped - viewport, viewport, virtual, clamped)
    ).toBeCloseTo(virtual - viewport, 5);
  });

  it("avoids intermediate overflow above Number.MAX_SAFE_INTEGER", () => {
    const clamped = 17_000_000;
    const virtual = 10_000_000_000_000; // 1e13 — multiplying by scrollOffset would overflow safe int
    const viewport = 800;
    const scrollOffset = clamped - viewport;

    const result = mapToVirtualOffset(scrollOffset, viewport, virtual, clamped);

    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(virtual);
    expect(result).toBeCloseTo(virtual - viewport, -3);
  });
});
