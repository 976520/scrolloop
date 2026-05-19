// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getMaxElementSize,
  resetMaxElementSizeCache,
} from "../getMaxElementSize";
import { installFakeBoundingRect } from "../../test-utils/fakeBoundingRect";

describe("getMaxElementSize", () => {
  beforeEach(() => {
    resetMaxElementSizeCache();
    document.body.innerHTML = "";
  });

  it("returns a positive number in jsdom environment", () => {
    const size = getMaxElementSize();
    expect(size).toBeGreaterThan(0);
    expect(Number.isFinite(size)).toBe(true);
  });

  it("caches the result across calls", () => {
    const first = getMaxElementSize();
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const second = getMaxElementSize();
    expect(second).toBe(first);
    expect(appendSpy).not.toHaveBeenCalled();
    appendSpy.mockRestore();
  });

  it("re-probes after the cache is reset", () => {
    getMaxElementSize();
    resetMaxElementSizeCache();
    const appendSpy = vi.spyOn(document.body, "appendChild");
    getMaxElementSize();
    expect(appendSpy).toHaveBeenCalled();
    appendSpy.mockRestore();
  });

  it("converges below a simulated browser ceiling", () => {
    const SIMULATED_LIMIT = 17_000_000;
    const restore = installFakeBoundingRect(SIMULATED_LIMIT);
    try {
      const size = getMaxElementSize();
      expect(size).toBeLessThanOrEqual(SIMULATED_LIMIT);
      expect(size).toBeGreaterThan(SIMULATED_LIMIT * 0.9);
    } finally {
      restore();
    }
  });

  it("returns a finite fallback when document is unavailable", () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error: intentional deletion for SSR simulation
    delete globalThis.document;
    try {
      const size = getMaxElementSize();
      expect(size).toBeGreaterThan(0);
      expect(Number.isFinite(size)).toBe(true);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it("returns the fallback without throwing when document.body is null", () => {
    const originalBody = document.body;
    Object.defineProperty(document, "body", {
      configurable: true,
      get: () => null,
    });
    try {
      const size = getMaxElementSize();
      expect(size).toBeGreaterThan(0);
      expect(Number.isFinite(size)).toBe(true);
    } finally {
      Object.defineProperty(document, "body", {
        configurable: true,
        value: originalBody,
        writable: true,
      });
    }
  });

  it("re-probes once document.body becomes available", () => {
    const originalBody = document.body;
    Object.defineProperty(document, "body", {
      configurable: true,
      get: () => null,
    });
    const fallback = getMaxElementSize();
    Object.defineProperty(document, "body", {
      configurable: true,
      value: originalBody,
      writable: true,
    });
    const probed = getMaxElementSize();
    expect(probed).not.toBe(fallback);
    expect(probed).toBeGreaterThan(0);
  });
});
