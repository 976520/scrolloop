import { describe, it, expect } from "vitest";
import { clamp } from "./clamp";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(0, 5, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(0, 10, 10)).toBe(10);
  });

  it("returns min when value is less than min", () => {
    expect(clamp(0, -5, 10)).toBe(0);
    expect(clamp(10, 5, 20)).toBe(10);
    expect(clamp(-10, -20, 0)).toBe(-10);
  });

  it("returns max when value is greater than max", () => {
    expect(clamp(0, 15, 10)).toBe(10);
    expect(clamp(0, 100, 50)).toBe(50);
    expect(clamp(-10, 5, 0)).toBe(0);
  });

  it("handles edge cases", () => {
    expect(clamp(0, 0, 0)).toBe(0);
    expect(clamp(5, 5, 5)).toBe(5);
    expect(clamp(-5, -5, -5)).toBe(-5);
  });

  it("handles negative ranges", () => {
    expect(clamp(-10, -5, -1)).toBe(-5);
    expect(clamp(-10, -15, -1)).toBe(-10);
    expect(clamp(-10, 0, -1)).toBe(-1);
  });

  it("handles floating point values", () => {
    expect(clamp(0, 3.14, 10)).toBe(3.14);
    expect(clamp(0, -0.5, 10)).toBe(0);
    expect(clamp(0, 10.5, 10)).toBe(10);
    expect(clamp(0.5, 0.3, 1.0)).toBe(0.5);
    expect(clamp(0.5, 1.5, 1.0)).toBe(1.0);
  });
});
