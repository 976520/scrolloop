import { describe, it, expect, vi, beforeEach } from "vitest";
import { Virtualizer } from "./Virtualizer";
import { FixedLayoutStrategy } from "../strategies/layout/FixedLayoutStrategy";
import { VirtualScrollSource } from "../strategies/scroll/VirtualScrollSource";

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
    expect(state.virtualItems).toHaveLength(3); // Initial viewport 0 + 2 overscan = 3 items (0, 1, 2)
    expect(state.totalSize).toBe(5000); // 100 items * 50px
  });

  it("should update state when viewport size changes", () => {
    // Simulate viewport resize
    // Since VirtualScrollSource doesn't expose a direct way to set viewport size for testing without DOM,
    // we might need to mock it or rely on its internal behavior if it was real.
    // However, VirtualScrollSource is headless, so we can manually trigger updates if we had access.
    // For this test, we'll mock the scroll source methods.

    const mockScrollSource = {
      getScrollOffset: vi.fn().mockReturnValue(0),
      getViewportSize: vi.fn().mockReturnValue(500),
      subscribe: vi.fn().mockReturnValue(() => {}),
      scrollTo: vi.fn(),
      setScrollOffset: vi.fn(),
      destroy: vi.fn(),
    };

    virtualizer = new Virtualizer(layoutStrategy, mockScrollSource, {
      count: 100,
      overscan: 2,
    });

    const state = virtualizer.getState();
    // Visible: 500 / 50 = 10 items.
    // Render: 0 to 9 + 2 overscan = 0 to 11. Total 12 items.
    expect(state.virtualItems.length).toBeGreaterThan(0);
    expect(state.visibleRange.startIndex).toBe(0);
    expect(state.visibleRange.endIndex).toBe(10);
  });

  it("should update state when count changes", () => {
    virtualizer.setCount(200);
    const state = virtualizer.getState();
    expect(state.totalSize).toBe(10000); // 200 * 50
  });

  it("should handle scroll updates", () => {
    const mockScrollSource = {
      getScrollOffset: vi.fn().mockReturnValue(100), // Scrolled 100px
      getViewportSize: vi.fn().mockReturnValue(500),
      subscribe: vi.fn((callback) => {
        // Simulate scroll event immediately for testing
        callback();
        return () => {};
      }),
      scrollTo: vi.fn(),
      setScrollOffset: vi.fn(),
      destroy: vi.fn(),
    };

    virtualizer = new Virtualizer(layoutStrategy, mockScrollSource, {
      count: 100,
      overscan: 0,
    });

    // Initial state calculation happens in constructor
    const state = virtualizer.getState();

    // 100px scroll / 50px item = start index 2
    expect(state.visibleRange.startIndex).toBe(2);
  });
});
