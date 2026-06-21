import { describe, it, expect, vi, beforeEach } from "vitest";
import { InfiniteSource } from "./InfiniteSource";
import type { InfiniteSourceOptions } from "./InfiniteSource";
import type { PageResponse } from "./types";

describe("InfiniteSource", () => {
  const mockFetchPage =
    vi.fn<
      (page: number, size: number) => Promise<PageResponse<{ id: number }>>
    >();

  beforeEach(() => {
    mockFetchPage.mockClear();
  });

  function makeManager(
    overrides?: Partial<InfiniteSourceOptions<{ id: number }>>
  ) {
    return new InfiniteSource({
      fetchPage: mockFetchPage,
      pageSize: 20,
      initialPage: 0,
      ...overrides,
    });
  }

  it("initializes with empty state", () => {
    const manager = makeManager();
    const state = manager.getState();

    expect(state.pages.size).toBe(0);
    expect(state.loadingPages.size).toBe(0);
    expect(state.total).toBe(0);
    expect(state.hasMore).toBe(true);
    expect(state.error).toBeNull();
    expect(state.allItems).toEqual([]);
  });

  it("loads page successfully", async () => {
    const mockData = Array(20)
      .fill(0)
      .map((_, i) => ({ id: i }));

    mockFetchPage.mockResolvedValue({
      items: mockData,
      total: 100,
      hasMore: true,
    });

    const manager = makeManager();
    await manager.loadPage(0);

    const state = manager.getState();
    expect(state.pages.size).toBe(1);
    expect(state.pages.get(0)).toEqual(mockData);
    expect(state.total).toBe(100);
    expect(state.hasMore).toBe(true);
    expect(mockFetchPage).toHaveBeenCalledWith(0, 20);
  });

  it("prevents duplicate page loads", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const manager = makeManager();
    await manager.loadPage(0);

    mockFetchPage.mockClear();
    await manager.loadPage(0);

    expect(mockFetchPage).not.toHaveBeenCalled();
  });

  it("handles fetch error", async () => {
    const error = new Error("Failed to fetch");
    mockFetchPage.mockRejectedValue(error);

    const manager = makeManager();
    await manager.loadPage(0);

    const state = manager.getState();
    expect(state.error?.message).toBe("Failed to fetch");
    expect(state.pages.size).toBe(0);
  });

  it("calls onPageLoad callback", async () => {
    const onPageLoad = vi.fn();
    const mockData = Array(20)
      .fill(0)
      .map((_, i) => ({ id: i }));

    mockFetchPage.mockResolvedValue({
      items: mockData,
      total: 100,
      hasMore: true,
    });

    const manager = makeManager({ onPageLoad });
    await manager.loadPage(0);

    expect(onPageLoad).toHaveBeenCalledWith(0, mockData);
  });

  it("calls onError callback", async () => {
    const onError = vi.fn();
    mockFetchPage.mockRejectedValue(new Error("Failed"));

    const manager = makeManager({ onError });
    await manager.loadPage(0);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("merges multiple pages into allItems", async () => {
    mockFetchPage.mockImplementation((page) =>
      Promise.resolve({
        items: Array(20)
          .fill(0)
          .map((_, i) => ({ id: page * 20 + i })),
        total: 100,
        hasMore: true,
      })
    );

    const manager = makeManager();
    await manager.loadPage(0);
    await manager.loadPage(1);

    const state = manager.getState();
    expect(state.allItems.length).toBe(100);
    expect(state.allItems[0]).toEqual({ id: 0 });
    expect(state.allItems[20]).toEqual({ id: 20 });
  });

  it("retry reloads initial page", async () => {
    const error = new Error("Failed");
    mockFetchPage.mockRejectedValueOnce(error).mockResolvedValueOnce({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const manager = makeManager();
    await manager.loadPage(0);

    expect(manager.getState().error).toBeTruthy();

    await manager.retry();

    const state = manager.getState();
    expect(state.error).toBeNull();
    expect(state.pages.size).toBe(1);
  });

  it("reset clears all state", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const manager = makeManager();
    await manager.loadPage(0);

    expect(manager.getState().pages.size).toBe(1);

    manager.reset();

    const state = manager.getState();
    expect(state.pages.size).toBe(0);
    expect(state.loadingPages.size).toBe(0);
    expect(state.total).toBe(0);
    expect(state.hasMore).toBe(true);
    expect(state.error).toBeNull();
  });

  it("does not load page beyond total", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 50,
      hasMore: false,
    });

    const manager = makeManager();
    await manager.loadPage(0);

    mockFetchPage.mockClear();
    await manager.loadPage(3);

    expect(mockFetchPage).not.toHaveBeenCalled();
  });

  it("tracks loading pages during fetch", async () => {
    let resolvePromise!: (value: PageResponse<{ id: number }>) => void;
    mockFetchPage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const manager = makeManager();
    const loadPromise = manager.loadPage(0);

    expect(manager.getState().loadingPages.has(0)).toBe(true);

    resolvePromise({ items: [], total: 0, hasMore: false });
    await loadPromise;

    expect(manager.getState().loadingPages.has(0)).toBe(false);
  });

  it("handles non-Error exceptions", async () => {
    mockFetchPage.mockRejectedValue("String error");

    const manager = makeManager();
    await manager.loadPage(0);

    expect(manager.getState().error?.message).toBe("String error");
  });

  it("does not update state when reset is called before fetch resolves", async () => {
    let resolvePromise!: (value: PageResponse<{ id: number }>) => void;
    mockFetchPage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const manager = makeManager();
    const loadPromise = manager.loadPage(0);

    expect(manager.getState().loadingPages.has(0)).toBe(true);

    manager.reset();

    expect(manager.getState().loadingPages.size).toBe(0);

    resolvePromise({ items: [{ id: 1 }], total: 100, hasMore: true });
    await loadPromise;

    expect(manager.getState().pages.size).toBe(0);
    expect(manager.getState().total).toBe(0);
  });

  it("does not set error when reset is called before fetch rejects", async () => {
    let rejectPromise!: (reason?: unknown) => void;
    mockFetchPage.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectPromise = reject;
        })
    );

    const manager = makeManager();
    const loadPromise = manager.loadPage(0);

    expect(manager.getState().loadingPages.has(0)).toBe(true);

    manager.reset();

    rejectPromise(new Error("network error"));
    await loadPromise;

    expect(manager.getState().error).toBeNull();
    expect(manager.getState().pages.size).toBe(0);
  });

  it("notifies subscribers on state change", async () => {
    mockFetchPage.mockResolvedValue({
      items: [{ id: 0 }],
      total: 1,
      hasMore: false,
    });

    const manager = makeManager();
    const subscriber = vi.fn();
    const unsubscribe = manager.subscribe(subscriber);

    await manager.loadPage(0);

    expect(subscriber).toHaveBeenCalled();
    const lastState =
      subscriber.mock.calls[subscriber.mock.calls.length - 1][0];
    expect(lastState.pages.size).toBe(1);

    unsubscribe();
  });

  it("unsubscribe stops receiving notifications", async () => {
    mockFetchPage.mockResolvedValue({
      items: [{ id: 0 }],
      total: 1,
      hasMore: false,
    });

    const manager = makeManager();
    const subscriber = vi.fn();
    const unsubscribe = manager.subscribe(subscriber);

    unsubscribe();
    await manager.loadPage(0);

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("updateCallbacks uses latest fetchPage", async () => {
    const originalFetch = vi.fn<typeof mockFetchPage>().mockResolvedValue({
      items: [{ id: 0 }],
      total: 1,
      hasMore: false,
    });
    const updatedFetch = vi.fn<typeof mockFetchPage>().mockResolvedValue({
      items: [{ id: 99 }],
      total: 1,
      hasMore: false,
    });

    const manager = new InfiniteSource({
      fetchPage: originalFetch,
      pageSize: 20,
      initialPage: 0,
    });

    manager.updateCallbacks({ fetchPage: updatedFetch });
    await manager.loadPage(0);

    expect(originalFetch).not.toHaveBeenCalled();
    expect(updatedFetch).toHaveBeenCalled();
    expect(manager.getState().pages.get(0)).toEqual([{ id: 99 }]);
  });

  it("destroy aborts in-flight requests and clears subscribers", async () => {
    let resolvePromise!: (value: PageResponse<{ id: number }>) => void;
    mockFetchPage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const manager = makeManager();
    const subscriber = vi.fn();
    manager.subscribe(subscriber);

    const loadPromise = manager.loadPage(0);
    manager.destroy();

    resolvePromise({ items: [{ id: 1 }], total: 100, hasMore: true });
    await loadPromise;

    // After destroy, subscribers are cleared — no new notifications after destroy
    const callsAfterDestroy = subscriber.mock.calls.length;
    manager.reset();
    expect(subscriber.mock.calls.length).toBe(callsAfterDestroy);
  });
});
