import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { InfiniteList } from "../../components/InfiniteList";
import type { PageResponse } from "../../types";
import type { CSSProperties } from "react";

interface TestItem {
  id: number;
  name: string;
}

describe("SSR - renderToString", () => {
  it("should render InfiniteList with initialData on server", () => {
    const initialData: TestItem[] = Array(50)
      .fill(0)
      .map((_, i) => ({ id: i, name: `Item ${i}` }));

    const fetchPage = async (
      page: number,
      size: number
    ): Promise<PageResponse<TestItem>> => {
      const start = page * size;
      const end = start + size;
      return {
        items: initialData.slice(start, end),
        total: initialData.length,
        hasMore: end < initialData.length,
      };
    };

    const html = renderToString(
      React.createElement(InfiniteList<TestItem>, {
        fetchPage,
        renderItem: (
          item: TestItem | undefined,
          index: number,
          style: CSSProperties
        ) =>
          React.createElement(
            "div",
            {
              "data-testid": `item-${index}`,
              "data-ssr-item": true,
              style,
            },
            item ? item.name : "Loading..."
          ),
        itemSize: 50,
        height: 400,
        pageSize: 20,
        isSSR: true,
        initialData,
        initialTotal: initialData.length,
      })
    );

    expect(html).toBeTruthy();
    expect(html).toContain("data-ssr-list");
    expect(html).toContain("data-ssr-item");
    expect(html).toContain("Item 0");
    expect(html).toContain("Item 49");
  });

  it("should render all items in SSR mode", () => {
    const initialData: TestItem[] = Array(10)
      .fill(0)
      .map((_, i) => ({ id: i, name: `Item ${i}` }));

    const fetchPage = async (): Promise<PageResponse<TestItem>> => {
      return {
        items: [],
        total: 0,
        hasMore: false,
      };
    };

    const html = renderToString(
      React.createElement(InfiniteList<TestItem>, {
        fetchPage,
        renderItem: (
          item: TestItem | undefined,
          index: number,
          style: CSSProperties
        ) =>
          React.createElement(
            "div",
            {
              "data-testid": `item-${index}`,
              style,
            },
            item ? item.name : "Loading..."
          ),
        itemSize: 50,
        height: 400,
        pageSize: 20,
        isSSR: true,
        initialData,
        initialTotal: initialData.length,
      })
    );

    for (let i = 0; i < initialData.length; i++) {
      expect(html).toContain(`Item ${i}`);
    }
  });

  it("should include SSR attributes in rendered HTML", () => {
    const initialData: TestItem[] = Array(5)
      .fill(0)
      .map((_, i) => ({ id: i, name: `Item ${i}` }));

    const fetchPage = async (): Promise<PageResponse<TestItem>> => {
      return { items: [], total: 0, hasMore: false };
    };

    const html = renderToString(
      React.createElement(InfiniteList<TestItem>, {
        fetchPage,
        renderItem: (
          item: TestItem | undefined,
          _index: number,
          style: CSSProperties
        ) =>
          React.createElement(
            "div",
            { style },
            item ? item.name : "Loading..."
          ),
        itemSize: 50,
        height: 400,
        isSSR: true,
        initialData,
        initialTotal: initialData.length,
      })
    );

    expect(html).toContain('data-ssr-list="true"');
    expect(html).toContain('data-ssr-item="true"');
  });
});
