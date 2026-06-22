import type { PageResponse } from "./types";
import { canLoadPage } from "./utils/canLoadPage";

export interface InfiniteSourceState<T> {
  pages: Map<number, T[]>;
  loadingPages: Set<number>;
  total: number;
  hasMore: boolean;
  error: Error | null;
  allItems: (T | undefined)[];
}

export interface InfiniteSourceOptions<T> {
  fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  pageSize: number;
  initialPage: number;
  onPageLoad?: (page: number, items: T[]) => void;
  onError?: (error: Error) => void;
}

export class InfiniteSource<T> {
  private fetchPage: (page: number, size: number) => Promise<PageResponse<T>>;
  private onPageLoad: ((page: number, items: T[]) => void) | undefined;
  private onError: ((error: Error) => void) | undefined;

  readonly pageSize: number;
  readonly initialPage: number;

  private _state: Omit<InfiniteSourceState<T>, "allItems"> = {
    pages: new Map(),
    loadingPages: new Set(),
    total: 0,
    hasMore: true,
    error: null,
  };

  private abortControllers = new Map<number, AbortController>();
  private subscribers = new Set<(state: InfiniteSourceState<T>) => void>();

  constructor({
    fetchPage,
    pageSize,
    initialPage,
    onPageLoad,
    onError,
  }: InfiniteSourceOptions<T>) {
    this.fetchPage = fetchPage;
    this.pageSize = pageSize;
    this.initialPage = initialPage;
    this.onPageLoad = onPageLoad;
    this.onError = onError;
  }

  getState(): InfiniteSourceState<T> {
    return {
      ...this._state,
      allItems: this.computeAllItems(),
    };
  }

  subscribe(callback: (state: InfiniteSourceState<T>) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  updateCallbacks(
    callbacks: Pick<
      InfiniteSourceOptions<T>,
      "fetchPage" | "onPageLoad" | "onError"
    >
  ): void {
    this.fetchPage = callbacks.fetchPage;
    this.onPageLoad = callbacks.onPageLoad;
    this.onError = callbacks.onError;
  }

  async loadPage(page: number): Promise<void> {
    const { pages, loadingPages, total, hasMore } = this._state;

    if (!canLoadPage(page, pages, loadingPages, total, this.pageSize, hasMore))
      return;

    this.setState({
      loadingPages: new Set(loadingPages).add(page),
      error: null,
    });

    const controller = new AbortController();
    this.abortControllers.set(page, controller);

    try {
      const response = await this.fetchPage(page, this.pageSize);

      if (controller.signal.aborted) return;

      this.setState({
        pages: new Map(this._state.pages).set(page, response.items),
        total: response.total,
        hasMore: response.hasMore,
      });
      this.onPageLoad?.(page, response.items);
    } catch (err) {
      if (controller.signal.aborted) return;

      const error = err instanceof Error ? err : new Error(String(err));
      this.setState({ error });
      this.onError?.(error);
    } finally {
      const next = new Set(this._state.loadingPages);
      next.delete(page);
      this.setState({ loadingPages: next });
      this.abortControllers.delete(page);
    }
  }

  retry(): void {
    this.setState({ error: null });
    this.loadPage(this.initialPage);
  }

  reset(): void {
    this.abortControllers.forEach((c) => c.abort());
    this.abortControllers.clear();

    this._state = {
      pages: new Map(),
      loadingPages: new Set(),
      total: 0,
      hasMore: true,
      error: null,
    };
    this.notify();
  }

  destroy(): void {
    this.abortControllers.forEach((c) => c.abort());
    this.abortControllers.clear();
    this.subscribers.clear();
  }

  private setState(
    partial: Partial<Omit<InfiniteSourceState<T>, "allItems">>
  ): void {
    this._state = { ...this._state, ...partial };
    this.notify();
  }

  private notify(): void {
    const state = this.getState();
    this.subscribers.forEach((cb) => cb(state));
  }

  private computeAllItems(): (T | undefined)[] {
    const { pages, total } = this._state;
    const items: (T | undefined)[] = new Array(total);
    pages.forEach((pageItems, pageNum) => {
      const startIndex = pageNum * this.pageSize;
      pageItems.forEach((item, i) => {
        items[startIndex + i] = item;
      });
    });
    return items;
  }
}
