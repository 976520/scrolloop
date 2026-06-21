import { describe, it, expect } from "vitest";
import { canLoadPage } from "./canLoadPage";

describe("canLoadPage", () => {
  const emptyPages = new Map<number, number[]>();
  const emptyLoading = new Set<number>();

  it("returns true for first page in empty state", () => {
    expect(canLoadPage(0, emptyPages, emptyLoading, 0, 20, true)).toBe(true);
  });

  it("returns false when page is already loaded", () => {
    const pages = new Map([[0, [1, 2, 3]]]);
    expect(canLoadPage(0, pages, emptyLoading, 100, 20, true)).toBe(false);
  });

  it("returns false when page is currently loading", () => {
    const loadingPages = new Set([2]);
    expect(canLoadPage(2, emptyPages, loadingPages, 100, 20, true)).toBe(false);
  });

  it("returns false when page is both loaded and loading", () => {
    const pages = new Map([[1, [1]]]);
    const loadingPages = new Set([1]);
    expect(canLoadPage(1, pages, loadingPages, 100, 20, true)).toBe(false);
  });

  it("returns false when page * pageSize >= total", () => {
    // total=50, pageSize=20: page 3 → 3*20=60 >= 50
    expect(canLoadPage(3, emptyPages, emptyLoading, 50, 20, true)).toBe(false);
  });

  it("returns false when page * pageSize exactly equals total", () => {
    // total=40, pageSize=20: page 2 → 2*20=40 >= 40
    expect(canLoadPage(2, emptyPages, emptyLoading, 40, 20, true)).toBe(false);
  });

  it("returns true when page * pageSize is within total", () => {
    // total=50, pageSize=20: page 2 → 2*20=40 < 50
    expect(canLoadPage(2, emptyPages, emptyLoading, 50, 20, true)).toBe(true);
  });

  it("skips total check when total is 0", () => {
    expect(canLoadPage(0, emptyPages, emptyLoading, 0, 20, true)).toBe(true);
  });

  it("returns false when !hasMore and page exceeds last page index (total=0)", () => {
    // total=0, hasMore=false: Math.floor(0/20)=0, page=1 > 0 → false
    expect(canLoadPage(1, emptyPages, emptyLoading, 0, 20, false)).toBe(false);
  });

  it("returns true for page 0 when !hasMore and total is 0", () => {
    // Math.floor(0/20)=0, page=0 is NOT > 0
    expect(canLoadPage(0, emptyPages, emptyLoading, 0, 20, false)).toBe(true);
  });

  it("returns true when hasMore is true even if page is beyond floor(total/pageSize)", () => {
    // total=50, pageSize=20: floor(50/20)=2, page=2 → NOT > 2, but line 11 catches it (2*20=40<50 → ok)
    // Use total=0 so line 11 is skipped: page=5, hasMore=true → line 13 not triggered → true
    expect(canLoadPage(5, emptyPages, emptyLoading, 0, 20, true)).toBe(true);
  });
});
