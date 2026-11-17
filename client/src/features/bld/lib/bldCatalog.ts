/**
 * BLD case catalog for the 3-Style lane: the full BLDDB (edge, corner,
 * parity, flip, twist) mapped into the study-catalog shape with memoized
 * derived states. Groups are named by the first two letters of each key
 * (flips share one group); special cases carry their kind in `meta` so the
 * compact tile labels stay short.
 */
import { applyFastMoves, SOLVED_FAST_STATE } from "@/lib/fastCube";
import { loadFullBldCatalog } from "./bldFullCatalog";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

export type BldStudyKind = "edge" | "corner" | "parity" | "flip" | "twist";
export type BldStudyCase = LastLayerCatalogCase & {
  family: "edge" | "corner" | "special";
  name: string;
  kind: BldStudyKind;
  /** Shown on the group tile's counter line (parity / flip / twist). */
  meta?: string;
};

const stateCache = new Map<string, string>();

/** The 54-sticker pre-image of a BLD case: apply the algorithm to a solved cube. */
export function bldCaseStateOf(algorithm: string): string {
  const cached = stateCache.get(algorithm);
  if (cached) return cached;
  const state = applyFastMoves(SOLVED_FAST_STATE, algorithm);
  stateCache.set(algorithm, state);
  return state;
}

function groupOf(kind: BldStudyKind, key: string) {
  if (kind === "flip") return "flip";
  return key.slice(0, 2);
}

function toCase(entry: { kind: string; key: string; algorithms: string[] }): BldStudyCase {
  const kind = entry.kind as BldStudyKind;
  const algorithm = entry.algorithms[0]!;
  const family = kind === "edge" || kind === "corner" ? kind : "special";
  return {
    id: `${kind}-${entry.key}`,
    family,
    kind,
    group: groupOf(kind, entry.key),
    meta: family === "special" ? kind : undefined,
    algorithm,
    state: bldCaseStateOf(algorithm),
    name: entry.key,
  };
}

/** Every BLDDB case, ordered edge → corner → special, for the SRS lane. */
export async function loadBldCatalog(): Promise<BldStudyCase[]> {
  const entries = await loadFullBldCatalog();
  return entries.map(toCase);
}
