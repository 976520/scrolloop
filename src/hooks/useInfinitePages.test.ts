import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInfinitePages } from './useInfinitePages';
import type { PageResponse } from '../types';

describe('useInfinitePages', () => {
  const mockFetchPage = vi.fn<(page: number, size: number) => Promise<PageResponse<{ id: number }>>>();

  beforeEach(() => {
    mockFetchPage.mockClear();
  });

  // 초기 상태가 올바르게 설정되는지 (빈 상태)
  it('initializes with empty state', () => {
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

  // 페이지 로드가 성공적으로 완료되고 상태가 올바르게 업데이트되는지
  it('loads page successfully', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    expect(mockFetchPage).toHaveBeenCalledWith(0, 20);
    expect(result.current.pages.get(0)).toEqual(mockData);
    expect(result.current.total).toBe(100);
    expect(result.current.hasMore).toBe(true);
  });

  // 같은 페이지를 중복 로드하려 할 때 한 번만 fetchPage가 호출되는지
  it('prevents duplicate page loads', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    mockFetchPage.mockClear();
    result.current.loadPage(0);

    await waitFor(() => {
      expect(mockFetchPage).not.toHaveBeenCalled();
    });
  });

  // fetchPage 실패했을 때 에러 상태가 올바르게 설정되는지
  it('handles fetch error', async () => {
    const error = new Error('Failed to fetch');
    mockFetchPage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('Failed to fetch');
    expect(result.current.pages.size).toBe(0);
  });

  // 페이지 로드 완료 시 onPageLoad 콜백이 올바른 인자와 함께 호출되는지
  it('calls onPageLoad callback', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(onPageLoad).toHaveBeenCalledWith(0, mockData);
    });
  });

  // fetchPage 실패했을 때 onError 콜백이 올바르게 호출되는지
  it('calls onError callback', async () => {
    const onError = vi.fn();
    const error = new Error('Failed');
    mockFetchPage.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
        onError,
      })
    );

    result.current.loadPage(0);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // 여러 페이지를 로드했을 때 allItems 배열에 올바르게 병합되는지
  // 각 페이지의 아이템이 올바른 인덱스에 배치되는지
  it('merges multiple pages into allItems', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    result.current.loadPage(1);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(2);
    });

    expect(result.current.allItems.length).toBe(100);
    expect(result.current.allItems[0]).toEqual({ id: 0 });
    expect(result.current.allItems[20]).toEqual({ id: 20 });
  });

  // 에러 발생 후 retry 함수가 초기 페이지를 다시 로드하는지
  it('retry reloads initial page', async () => {
    const error = new Error('Failed');
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    result.current.retry();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.pages.size).toBe(1);
    });
  });

  // reset 함수가 모든 상태(pages, loadingPages, total, hasMore, error)를 초기값으로 되돌리는지
  it('reset clears all state', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    result.current.reset();

    await waitFor(() => {
      expect(result.current.pages.size).toBe(0);
    });

    expect(result.current.loadingPages.size).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();
  });

  // total을 초과하는 페이지를 로드하려 할 때 fetchPage가 호출되지 않는지
  // (page * pageSize >= total 체크)
  it('does not load page beyond total', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.pages.size).toBe(1);
    });

    mockFetchPage.mockClear();

    result.current.loadPage(3);

    await waitFor(() => {
      expect(mockFetchPage).not.toHaveBeenCalled();
    });
  });

  // 페이지 로딩 중일 때 loadingPages Set에 올바르게 추가되는지
  it('tracks loading pages', async () => {
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

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.loadingPages.has(0)).toBe(true);
    });
  });

  // Error 객체가 아닌 값(문자열 등)이 reject되었을 때도 올바르게 처리되는지
  it('handles non-Error exceptions', async () => {
    mockFetchPage.mockRejectedValue('String error');

    const { result } = renderHook(() =>
      useInfinitePages({
        fetchPage: mockFetchPage,
        pageSize: 20,
        initialPage: 0,
      })
    );

    result.current.loadPage(0);

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toBe('String error');
  });
});

