export function isServerSide(): boolean {
  return typeof window === "undefined";
}
