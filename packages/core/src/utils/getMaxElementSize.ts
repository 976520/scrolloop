const SSR_FALLBACK = 6_000_000;
const PROBE_LOWER_BOUND = 1_000_000;
const PROBE_UPPER_BOUND = 40_000_000;
const PROBE_RESOLUTION = 100_000;
const SAFETY_FACTOR = 0.95;

let cached: number | null = null;

export function getMaxElementSize(): number {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return SSR_FALLBACK;

  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;visibility:hidden;width:1px;left:-9999px;top:0;pointer-events:none";
  document.body.appendChild(probe);

  let lo = PROBE_LOWER_BOUND;
  let hi = PROBE_UPPER_BOUND;
  try {
    while (hi - lo > PROBE_RESOLUTION) {
      const mid = ((lo + hi) / 2) | 0;
      probe.style.height = `${mid}px`;
      const actual = probe.getBoundingClientRect().height;
      if (actual >= mid - 1) lo = mid;
      else hi = mid;
    }
  } finally {
    probe.remove();
  }

  cached = Math.floor(lo * SAFETY_FACTOR);
  return cached;
}

export function resetMaxElementSizeCache(): void {
  cached = null;
}
