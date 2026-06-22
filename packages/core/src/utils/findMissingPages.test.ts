import { describe, it, expect } from "vitest";
import { findMissingPages } from "./findMissingPages";

describe("findMissingPages", () => {
  const emptyPages = new Map<number, number[]>();
  const emptyLoading = new Set<number>();

  it("returns all pages in range when nothing is loaded or loading", () => {
    const result = findMissingPages(0, 2, emptyPages, emptyLoading);
    expect(result).toEqual([0, 1, 2]);
  });

  it("returns empty array when start > end", () => {
    const result = findMissingPages(5, 3, emptyPages, emptyLoading);
    expect(result).toEqual([]);
  });

  it("returns empty array when start === end and page is loaded", () => {
    const pages = new Map([[1, [1, 2]]]);
    const result = findMissingPages(1, 1, pages, emptyLoading);
    expect(result).toEqual([]);
  });

  it("excludes pages that are already loaded", () => {
    const pages = new Map([[1, [1, 2]]]);
    const result = findMissingPages(0, 3, pages, emptyLoading);
    expect(result).toEqual([0, 2, 3]);
  });

  it("excludes pages that are currently loading", () => {
    const loadingPages = new Set([2]);
    const result = findMissingPages(0, 3, emptyPages, loadingPages);
    expect(result).toEqual([0, 1, 3]);
  });

  it("excludes pages that are both loaded and loading", () => {
    const pages = new Map([[0, [1]]]);
    const loadingPages = new Set([2]);
    const result = findMissingPages(0, 3, pages, loadingPages);
    expect(result).toEqual([1, 3]);
  });

  it("returns empty array when all pages are loaded", () => {
    const pages = new Map([
      [0, [1]],
      [1, [2]],
      [2, [3]],
    ]);
    const result = findMissingPages(0, 2, pages, emptyLoading);
    expect(result).toEqual([]);
  });

  it("returns empty array when all pages are loading", () => {
    const loadingPages = new Set([0, 1, 2]);
    const result = findMissingPages(0, 2, emptyPages, loadingPages);
    expect(result).toEqual([]);
  });

  it("handles single-page range that is missing", () => {
    const result = findMissingPages(3, 3, emptyPages, emptyLoading);
    expect(result).toEqual([3]);
  });

  it("handles large range with sparse loaded pages", () => {
    const pages = new Map([
      [2, []],
      [5, []],
    ]);
    const result = findMissingPages(0, 6, pages, emptyLoading);
    expect(result).toEqual([0, 1, 3, 4, 6]);
  });
});
