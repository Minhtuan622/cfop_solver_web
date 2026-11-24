export const BLDDB_COMMITS = {
  v2: "60a82342bffed07ce83e9d99026075752ec6c78a",
  main: "53f693299cc3ba9030d83c78bf55598e4c298792",
} as const;

export const BLDDB_BASE = {
  v2: `https://raw.githubusercontent.com/nbwzx/blddb/${BLDDB_COMMITS.v2}/public/data/`,
  main: `https://raw.githubusercontent.com/nbwzx/blddb/${BLDDB_COMMITS.main}/assets/json/`,
} as const;

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

const resolved = new Map<BldCatalogFile, Promise<unknown>>();

export class BldCatalogUnavailableError extends Error {
  constructor(readonly file: BldCatalogFile) {
    super(`Không tải được dữ liệu thuật toán BLD (${file}).`);
    this.name = "BldCatalogUnavailableError";
  }
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

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
    }
  }
  return data;
}

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
    const cached = await readCache(cache, url);
    if (cached !== null) return cached as T;
    throw new BldCatalogUnavailableError(file);
  }
}

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

export function clearBldCatalogMemory(): void {
  resolved.clear();
}
