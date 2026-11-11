/**
 * Single source of truth for the BLDDB algorithm catalog.
 *
 * Upstream publishes the algorithms on moving branches (`main`, `v2`), so a
 * plain branch reference can change or drop an algorithm without notice and
 * the app would silently resolve a different commutator. The URLs below are
 * pinned to a commit SHA: the catalog stays byte-identical until someone
 * bumps the SHA deliberately.
 *
 * The files are also cached in the browser (Cache API) so a drill keeps
 * working offline and the ~13 MB catalog is not re-downloaded on every visit.
 */

/** Pinned upstream commits. Bump deliberately, never to a branch name. */
export const BLDDB_COMMITS = {
  v2: "60a82342bffed07ce83e9d99026075752ec6c78a",
  main: "53f693299cc3ba9030d83c78bf55598e4c298792",
} as const;

export const BLDDB_BASE = {
  v2: `https://raw.githubusercontent.com/nbwzx/blddb/${BLDDB_COMMITS.v2}/public/data/`,
  main: `https://raw.githubusercontent.com/nbwzx/blddb/${BLDDB_COMMITS.main}/assets/json/`,
} as const;

/** Every catalog file the app needs, keyed by the role it plays. */
export const BLDDB_FILES = {
  edge: `${BLDDB_BASE.v2}edgeManmade.json`,
  corner: `${BLDDB_BASE.v2}cornerManmade.json`,
  parity: `${BLDDB_BASE.main}parityAlgToInfoManmade.json`,
  flip: `${BLDDB_BASE.main}twoFlipsAlgToInfo.json`,
  twist: `${BLDDB_BASE.main}twistsAlgToInfo.json`,
  parityEdge: `${BLDDB_BASE.main}parityEdgeAlgToStandard.json`,
  parityCorner: `${BLDDB_BASE.main}parityCornerAlgToStandard.json`,
  edgeCode: `${BLDDB_BASE.main}edgePosToCode.json`,
  cornerCode: `${BLDDB_BASE.main}cornerPosToCode.json`,
} as const;

export type BldCatalogFile = keyof typeof BLDDB_FILES;

const CACHE_NAME = "cfop-bld-catalog-v1";

/** In-flight and already resolved requests, keyed by catalog file. */
const resolved = new Map<BldCatalogFile, Promise<unknown>>();

/** Raised when a catalog file is neither downloadable nor cached. */
export class BldCatalogUnavailableError extends Error {
  constructor(readonly file: BldCatalogFile) {
    super(`Không tải được dữ liệu thuật toán BLD (${file}).`);
    this.name = "BldCatalogUnavailableError";
  }
}

/** Opens the browser cache, or returns null when caching is unavailable. */
async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/**
 * Reads the response body and stores a copy in the cache.
 *
 * The body is cloned before it is consumed; a response that cannot be cloned
 * (already read, or a stubbed response) is still read normally, just not
 * cached.
 */
async function readAndCache(
  cache: Cache | null,
  url: string,
  response: Response
): Promise<unknown> {
  let copy: Response | undefined;
  try {
    copy = response.clone();
  } catch {
    copy = undefined;
  }
  const data = await response.json();
  if (cache && copy) {
    try {
      await cache.put(url, copy);
    } catch {
      // A full quota or an uncacheable response must not break the drill.
    }
  }
  return data;
}

/** Reads a previously cached copy, or null when there is none. */
async function readCache(
  cache: Cache | null,
  url: string
): Promise<unknown | null> {
  if (!cache) return null;
  try {
    const cached = await cache.match(url);
    if (!cached) return null;
    return await cached.json();
  } catch {
    return null;
  }
}

async function loadFile<T>(file: BldCatalogFile): Promise<T> {
  const url = BLDDB_FILES[file];
  const cache = await openCache();
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await readAndCache(cache, url, response)) as T;
  } catch {
    // Offline, blocked or rate limited: fall back to the cached copy.
    const cached = await readCache(cache, url);
    if (cached !== null) return cached as T;
    throw new BldCatalogUnavailableError(file);
  }
}

/**
 * Loads one catalog file.
 *
 * Concurrent callers share a single request, and a file that is already in
 * memory is never downloaded again.
 */
export function fetchBldCatalogFile<T = unknown>(
  file: BldCatalogFile
): Promise<T> {
  const existing = resolved.get(file);
  if (existing) return existing as Promise<T>;
  const promise = loadFile<T>(file).catch((error: unknown) => {
    resolved.delete(file);
    throw error;
  });
  resolved.set(file, promise);
  return promise as Promise<T>;
}

/** Drops the in-memory copies so the next load hits the cache again. */
export function clearBldCatalogMemory(): void {
  resolved.clear();
}
