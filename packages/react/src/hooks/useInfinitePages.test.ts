import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useInfinitePages } from "./useInfinitePages";
import type { PageResponse } from "../types";

describe("useInfinitePages", () => {
  const mockFetchPage =
    vi.fn<
      (page: number, size: number) => Promise<PageResponse<{ id: number }>>
    >();

  beforeEach(() => {
    mockFetchPage.mockClear();
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    expect(result.current.pages.size).toBe(0);
    expect(result.current.loadingPages.size).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.allItems).toEqual([]);
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

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    expect(mockFetchPage).toHaveBeenCalledWith(0, 20);
    expect(result.current.pages.get(0)).toEqual(mockData);
    expect(result.current.total).toBe(100);
    expect(result.current.hasMore).toBe(true);
  });

  it("prevents duplicate page loads", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    mockFetchPage.mockClear();

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(mockFetchPage).not.toHaveBeenCalled();
    });
  });

  it("handles fetch error", async () => {
    const error = new Error("Failed to fetch");
    mockFetchPage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe("Failed to fetch");
    expect(result.current.pages.size).toBe(0);
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

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
        onPageLoad,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(onPageLoad).toHaveBeenCalledWith(0, mockData);
    });
  });

  it("calls onError callback", async () => {
    const onError = vi.fn();
    const error = new Error("Failed");
    mockFetchPage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
        onError,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
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

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    await act(async () => {
      result.current.loadPage(1);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(2);
    });

    expect(result.current.allItems.length).toBe(100);
    expect(result.current.allItems[0]).toEqual({ id: 0 });
    expect(result.current.allItems[20]).toEqual({ id: 20 });
  });

  it("retry reloads initial page", async () => {
    const error = new Error("Failed");
    mockFetchPage.mockRejectedValueOnce(error).mockResolvedValueOnce({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.pages.size).toBe(1);
    });
  });

  it("reset clears all state", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 100,
      hasMore: true,
    });

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(0);
    });

    expect(result.current.loadingPages.size).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("does not load page beyond total", async () => {
    mockFetchPage.mockResolvedValue({
      items: Array(20).fill({ id: 0 }),
      total: 50,
      hasMore: false,
    });

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    mockFetchPage.mockClear();

    await act(async () => {
      result.current.loadPage(3);
    });

    await waitFor(() => {
      expect(mockFetchPage).not.toHaveBeenCalled();
    });
  });

  it("tracks loading pages", async () => {
    mockFetchPage.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.loadingPages.has(0)).toBe(true);
    });
  });

  it("handles non-Error exceptions", async () => {
    mockFetchPage.mockRejectedValue("String error");

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    await act(async () => {
      result.current.loadPage(0);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe("String error");
  });
});
