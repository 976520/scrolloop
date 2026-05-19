export function mapToVirtualOffset(
  scrollOffset: number,
  viewportSize: number,
  virtualTotal: number,
  clampedTotal: number
): number {
  if (virtualTotal <= clampedTotal) return scrollOffset;
  const scrollable = clampedTotal - viewportSize;
  if (scrollable <= 0) return 0;
  const ratio = scrollOffset / scrollable;
  return ratio * (virtualTotal - viewportSize);
}
