import { describe, it, expect, vi, beforeEach } from "vitest";
import { Virtualizer } from "../Virtualizer";
import { FixedLayoutStrategy } from "../../strategies/layout/FixedLayoutStrategy";
import { VirtualScrollSource } from "../../strategies/scroll/VirtualScrollSource";
import { Plugin } from "../../plugins/Plugin";
import { VirtualizerState, Range } from "../../types";

describe("Virtualizer", () => {
  let layoutStrategy: FixedLayoutStrategy;
  let scrollSource: VirtualScrollSource;
  let virtualizer: Virtualizer;

  beforeEach(() => {
    layoutStrategy = new FixedLayoutStrategy(50);
    scrollSource = new VirtualScrollSource();
    virtualizer = new Virtualizer(layoutStrategy, scrollSource, {
      count: 100,
      overscan: 2,
    });
  });

  it("should initialize with correct state", () => {
    const state = virtualizer.getState();
    expect(state.virtualItems).toHaveLength(3);
    expect(state.totalSize).toBe(5000);
  });

  it("should update state when viewport size changes", () => {
    scrollSource.setViewportSize(500);

    const state = virtualizer.getState();
    expect(state.virtualItems).toHaveLength(13);
    expect(state.visibleRange.startIndex).toBe(0);
    expect(state.visibleRange.endIndex).toBe(10);
  });

  it("should update state when count changes", () => {
    virtualizer.setCount(200);
    const state = virtualizer.getState();
    expect(state.totalSize).toBe(10000);
  });

  it("should call onChange when state updates", () => {
    const onChange = vi.fn();
    virtualizer = new Virtualizer(layoutStrategy, scrollSource, {
      count: 100,
      overscan: 2,
      onChange,
    });

    virtualizer.update();
    expect(onChange).toHaveBeenCalledWith(virtualizer.getState());
  });

  it("should handle scroll updates", () => {
    scrollSource.setViewportSize(500);
    scrollSource.setScrollOffset(100);

    const state = virtualizer.getState();
    expect(state.visibleRange.startIndex).toBe(2);
  });

  it("should not update if count is same", () => {
    const updateSpy = vi.spyOn(virtualizer, "update");
    virtualizer.setCount(100);
    expect(updateSpy).not.toHaveBeenCalled();
    virtualizer.setCount(101);
    expect(updateSpy).toHaveBeenCalled();
  });

  describe("Plugins", () => {
    it("should initialize plugins on constructor", () => {
      const plugin: Plugin = {
        name: "test",
        onInit: vi.fn(),
      };
      virtualizer.addPlugin(plugin);
      expect(plugin.onInit).toHaveBeenCalled();
    });

    it("should allow plugins to modify state via beforeStateChange", () => {
      const plugin: Plugin = {
        name: "test",
        beforeStateChange: vi.fn((state) => {
          return { ...state, totalSize: 9999 };
        }),
      };
      virtualizer.addPlugin(plugin);

      virtualizer.update();

      expect(virtualizer.getState().totalSize).toBe(9999);
      expect(plugin.beforeStateChange).toHaveBeenCalled();
    });

    it("should notify plugins via afterStateChange", () => {
      const plugin: Plugin = {
        name: "test",
        afterStateChange: vi.fn(),
      };
      virtualizer.addPlugin(plugin);
      virtualizer.update();
      expect(plugin.afterStateChange).toHaveBeenCalledWith(
        virtualizer.getState()
      );
    });

    it("should allow plugins to modify range via onRangeCalculated", () => {
      const plugin: Plugin = {
        name: "test",
        onRangeCalculated: vi.fn((range, count) => {
          return { startIndex: 0, endIndex: 0 };
        }),
      };
      virtualizer.addPlugin(plugin);
      virtualizer.update();

      const state = virtualizer.getState();
      expect(state.renderRange).toEqual({ startIndex: 0, endIndex: 0 });
      expect(state.virtualItems).toHaveLength(1);
    });

    it("should call onDestroy when virtualizer is destroyed", () => {
      const plugin: Plugin = {
        name: "test",
        onDestroy: vi.fn(),
      };
      virtualizer.addPlugin(plugin);
      virtualizer.destroy();
      expect(plugin.onDestroy).toHaveBeenCalled();
    });
  });

  it("should unsubscribe from scroll source on destroy", () => {
    const originalSubscribe = scrollSource.subscribe.bind(scrollSource);
    const unsubscribeSpy = vi.fn();

    scrollSource.subscribe = vi.fn(() => {
      return unsubscribeSpy;
    });

    virtualizer = new Virtualizer(layoutStrategy, scrollSource, { count: 100 });

    virtualizer.destroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
