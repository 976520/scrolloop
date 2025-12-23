import { describe, it, expect } from "vitest";
import { OverscanPlugin } from "./OverscanPlugin";
import { Range } from "../types";

describe("OverscanPlugin", () => {
  it("should initialize with default overscan", () => {
    const plugin = new OverscanPlugin();
    const range: Range = { startIndex: 10, endIndex: 20 };
    const count = 100;
    const result = plugin.onRangeCalculated(range, count);

    expect(result.startIndex).toBe(6);
    expect(result.endIndex).toBe(24);
  });

  it("should initialize with custom overscan", () => {
    const plugin = new OverscanPlugin(2);
    const range: Range = { startIndex: 10, endIndex: 20 };
    const count = 100;
    const result = plugin.onRangeCalculated(range, count);

    expect(result.startIndex).toBe(8);
    expect(result.endIndex).toBe(22);
  });

  it("should clamp start index to 0", () => {
    const plugin = new OverscanPlugin(5);
    const range: Range = { startIndex: 2, endIndex: 10 };
    const count = 100;
    const result = plugin.onRangeCalculated(range, count);

    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(15);
  });

  it("should clamp end index to count - 1", () => {
    const plugin = new OverscanPlugin(5);
    const range: Range = { startIndex: 90, endIndex: 98 };
    const count = 100;
    const result = plugin.onRangeCalculated(range, count);

    expect(result.startIndex).toBe(85);
    expect(result.endIndex).toBe(99);
  });

  it("should have correct name", () => {
    const plugin = new OverscanPlugin();
    expect(plugin.name).toBe("overscan");
  });
});
