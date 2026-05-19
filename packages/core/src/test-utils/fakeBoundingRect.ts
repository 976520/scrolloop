export function installFakeBoundingRect(limit?: number): () => void {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const declared = parseFloat(this.style.height || "0");
    const height = limit === undefined ? declared : Math.min(declared, limit);
    return {
      x: 0,
      y: 0,
      width: 1,
      height,
      top: 0,
      left: 0,
      right: 1,
      bottom: height,
      toJSON: () => ({}),
    } as DOMRect;
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}
