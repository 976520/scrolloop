import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InfiniteList } from './InfiniteList';
import type { PageResponse } from '../types';

describe('InfiniteList', () => {
  const mockFetchPage = vi.fn<(page: number, size: number) => Promise<PageResponse<{ id: number; name: string }>>>();

  const defaultProps = {
    fetchPage: mockFetchPage,
    itemSize: 50,
    height: 400,
    renderItem: (item: { id: number; name: string } | undefined, index: number) => (
      <div data-testid={`item-${index}`}>{item ? item.name : 'Loading...'}</div>
    ),
  };

  beforeEach(() => {
    mockFetchPage.mockClear();
  });

  it('shows loading state initially', () => {
    mockFetchPage.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    render(<InfiniteList {...defaultProps} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders items after successful fetch', async () => {
    mockFetchPage.mockImplementation((page) =>
      Promise.resolve({
        items: Array(20)
          .fill(0)
          .map((_, i) => ({ id: page * 20 + i, name: `Item ${page * 20 + i}` })),
        total: 100,
        hasMore: true,
      })
    );

    render(<InfiniteList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
    });

    expect(screen.getByTestId('item-0')).toHaveTextContent('Item 0');
  });

  it('shows error state when fetch fails', async () => {
    mockFetchPage.mockRejectedValue(new Error('Failed to fetch'));

    render(<InfiniteList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error.')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    mockFetchPage.mockResolvedValue({
      items: [],
      total: 0,
      hasMore: false,
    });

    render(<InfiniteList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No data.')).toBeInTheDocument();
    });
  });

  it('calls onPageLoad callback', async () => {
    const onPageLoad = vi.fn();
    const mockData = Array(20)
      .fill(0)
      .map((_, i) => ({ id: i, name: `Item ${i}` }));

    mockFetchPage.mockResolvedValue({
      items: mockData,
      total: 100,
      hasMore: true,
    });

    render(<InfiniteList {...defaultProps} onPageLoad={onPageLoad} />);

    await waitFor(() => {
      expect(onPageLoad).toHaveBeenCalledWith(0, mockData);
    });
  });

  it('calls onError callback on fetch failure', async () => {
    const onError = vi.fn();
    const error = new Error('Failed to fetch');
    mockFetchPage.mockRejectedValue(error);

    render(<InfiniteList {...defaultProps} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('renders custom loading component', () => {
    mockFetchPage.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    const CustomLoading = () => <div>Custom Loading...</div>;

    render(<InfiniteList {...defaultProps} renderLoading={CustomLoading} />);

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });

  it('renders custom error component', async () => {
    mockFetchPage.mockRejectedValue(new Error('Failed'));

    const CustomError = (error: Error, retry: () => void) => (
      <div>
        <p>Custom Error: {error.message}</p>
        <button onClick={retry}>Try Again</button>
      </div>
    );

    render(<InfiniteList {...defaultProps} renderError={CustomError} />);

    await waitFor(() => {
      expect(screen.getByText('Custom Error: Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders custom empty component', async () => {
    mockFetchPage.mockResolvedValue({
      items: [],
      total: 0,
      hasMore: false,
    });

    const CustomEmpty = () => <div>No items found</div>;

    render(<InfiniteList {...defaultProps} renderEmpty={CustomEmpty} />);

    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  it('uses custom pageSize', async () => {
    const mockData = Array(50)
      .fill(0)
      .map((_, i) => ({ id: i, name: `Item ${i}` }));

    mockFetchPage.mockResolvedValue({
      items: mockData,
      total: 200,
      hasMore: true,
    });

    render(<InfiniteList {...defaultProps} pageSize={50} />);

    await waitFor(() => {
      expect(mockFetchPage).toHaveBeenCalledWith(expect.any(Number), 50);
    });
  });
});

