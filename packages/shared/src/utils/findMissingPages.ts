export function findMissingPages<T>(
  prefetchStart: number,
  prefetchEnd: number,
  pages: Map<number, T[]>,
  loadingPages: Set<number>
): number[] {
  const missingPages: number[] = [];
  for (let p = prefetchStart; p <= prefetchEnd; p++) {
    if (!pages.has(p) && !loadingPages.has(p)) missingPages.push(p);
  }
  return missingPages;
}
