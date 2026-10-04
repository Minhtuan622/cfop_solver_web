import type { PracticeCase } from "./types";

import { PLL_EDGES_ONLY_CASES } from "./pll/edges-only";
import { PLL_ADJACENT_CORNER_SWAP_CASES } from "./pll/adjacent-corner-swap";
import { PLL_DIAGONAL_CORNER_SWAP_CASES } from "./pll/diagonal-corner-swap";

export { PLL_EDGES_ONLY_CASES, PLL_ADJACENT_CORNER_SWAP_CASES, PLL_DIAGONAL_CORNER_SWAP_CASES };

const PLL_CASE_ORDER = ["H", "Z", "Ua", "Ub", "Aa", "Ab", "E", "F", "Ja", "Jb", "Ra", "Rb", "T", "Y", "V", "Na", "Nb", "Ga", "Gb", "Gc", "Gd"];
const PLL_BY_ID = new Map([...PLL_EDGES_ONLY_CASES, ...PLL_ADJACENT_CORNER_SWAP_CASES, ...PLL_DIAGONAL_CORNER_SWAP_CASES].map((practiceCase) => [practiceCase.id, practiceCase] as const));
export const PLL_CASES: PracticeCase[] = PLL_CASE_ORDER.map((id) => PLL_BY_ID.get(id) as PracticeCase);
