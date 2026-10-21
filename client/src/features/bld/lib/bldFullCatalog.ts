/* BLDDB catalog adapter: retains every algorithm variant while the UI paginates cases. */
export type BldCatalogGroup = "edge" | "corner" | "special";
export type BldCatalogKind = "edge" | "corner" | "parity" | "flip" | "twist";
export type BldCatalogCase = { group: BldCatalogGroup; kind: BldCatalogKind; key: string; algorithms: string[] };
type RawCatalog = Record<string, unknown>;

const V2 = "https://raw.githubusercontent.com/nbwzx/blddb/v2/public/data/";
const MAIN = "https://raw.githubusercontent.com/nbwzx/blddb/main/assets/json/";

function nestedAlgorithms(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((variant) => Array.isArray(variant) && Array.isArray(variant[0]) ? variant[0].filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : []);
}
function directAlgorithms(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : []; }

/**
 * Picks the first usable algorithm out of a BLDDB entry.
 *
 * A catalog entry holds either one algorithm or a list of variants, so the
 * first non-empty string is the one the drill and the report both display.
 */
export function firstCatalogAlgorithm(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() ? value.trim() : undefined;
  if (!Array.isArray(value)) return undefined;
  for (const item of value) {
    const algorithm = firstCatalogAlgorithm(item);
    if (algorithm) return algorithm;
  }
  return undefined;
}
function toCases(raw: RawCatalog, group: BldCatalogGroup, kind: BldCatalogKind, nested: boolean): BldCatalogCase[] {
  return Object.entries(raw).map(([key, value]) => ({
    group,
    kind,
    key,
    algorithms: Array.from(new Set((nested ? nestedAlgorithms(value) : directAlgorithms(value)).map((algorithm) => algorithm.trim()))),
  })).filter((entry) => entry.algorithms.length > 0);
}

export async function loadFullBldCatalog(): Promise<BldCatalogCase[]> {
  const request = (url: string) => fetch(url).then((response) => response.ok ? (response.json() as Promise<RawCatalog>) : Promise.reject(new Error(url)));
  const [edge, corner, parity, flip, twist] = await Promise.all([
    request(`${V2}edgeManmade.json`), request(`${V2}cornerManmade.json`), request(`${MAIN}parityAlgToInfoManmade.json`), request(`${MAIN}twoFlipsAlgToInfo.json`), request(`${MAIN}twistsAlgToInfo.json`),
  ]);
  return [
    ...toCases(edge, "edge", "edge", true), ...toCases(corner, "corner", "corner", true), ...toCases(parity, "special", "parity", true), ...toCases(flip, "special", "flip", false), ...toCases(twist, "special", "twist", false),
  ];
}
