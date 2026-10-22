/**
 * Reads a CSS custom property from the document.
 *
 * Canvas and WebGL code cannot use `var(--token)` directly, so the handful of
 * places that paint outside the DOM resolve the token at paint time. The
 * fallback keeps the paint working when the document has no stylesheet yet.
 */
export function cssToken(name: string, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallback;
  }
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}
