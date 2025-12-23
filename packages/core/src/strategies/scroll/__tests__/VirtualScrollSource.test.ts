import { describe, it, expect, vi } from "vitest";
import { VirtualScrollSource } from "../VirtualScrollSource";

describe("VirtualScrollSource", () => {
  it("should initialize with default values", () => {
    const source = new VirtualScrollSource();
    expect(source.getScrollOffset()).toBe(0);
    expect(source.getViewportSize()).toBe(0);
  });

  it("should update viewport size and notify listeners", () => {
    const source = new VirtualScrollSource();
    const listener = vi.fn();
    source.subscribe(listener);

    source.setViewportSize(500);
    expect(source.getViewportSize()).toBe(500);
    expect(listener).toHaveBeenCalledWith(0);
  });

  it("should update scroll offset and notify listeners", () => {
    const source = new VirtualScrollSource();
    const listener = vi.fn();
    source.subscribe(listener);

    source.setScrollOffset(100);

    expect(source.getScrollOffset()).toBe(100);
    expect(listener).toHaveBeenCalledWith(100);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not notify listeners if scroll offset is the same", () => {
    const source = new VirtualScrollSource();
    const listener = vi.fn();
    source.subscribe(listener);

    source.setScrollOffset(0);
    expect(listener).not.toHaveBeenCalled();

    source.setScrollOffset(100);
    listener.mockClear();

    source.setScrollOffset(100);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should unsubscribe correctly", () => {
    const source = new VirtualScrollSource();
    const listener = vi.fn();
    const unsubscribe = source.subscribe(listener);

    source.setScrollOffset(100);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    source.setScrollOffset(200);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple listeners", () => {
    const source = new VirtualScrollSource();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    source.subscribe(listenerA);
    source.subscribe(listenerB);

    source.setScrollOffset(50);

    expect(listenerA).toHaveBeenCalledWith(50);
    expect(listenerB).toHaveBeenCalledWith(50);
  });
});
