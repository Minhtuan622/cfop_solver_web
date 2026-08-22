export type AppFontSize = "small" | "medium" | "large";

const FONT_SIZE_KEY = "cfop-app-font-size-v1";

export function readAppFontSize(): AppFontSize {
  try { const stored = localStorage.getItem(FONT_SIZE_KEY); return stored === "small" || stored === "large" ? stored : "medium"; } catch { return "medium"; }
}

export function applyAppFontSize(size: AppFontSize) {
  document.documentElement.dataset.fontSize = size;
}

export function writeAppFontSize(size: AppFontSize) {
  localStorage.setItem(FONT_SIZE_KEY, size);
  applyAppFontSize(size);
}
