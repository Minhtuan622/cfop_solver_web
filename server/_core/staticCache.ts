export function cacheControlForFile(filePath: string): string | undefined {
  const normalized = filePath.replace(/\\/g, "/");
  if (/(^|\/)assets\//.test(normalized)) {
    return "public, max-age=31536000, immutable";
  }
  if (normalized.endsWith("index.html")) {
    return "no-cache";
  }
  return undefined;
}
