import { OLL_CASES } from "./oll";
import { PLL_CASES } from "./pll";
import type { PracticeCase } from "./types";

export const LAST_LAYER_CASES: PracticeCase[] = [...OLL_CASES, ...PLL_CASES];

export function practiceCasesByKind(kind: PracticeCase["kind"]): PracticeCase[] {
  return kind === "OLL" ? OLL_CASES : PLL_CASES;
}

export function practiceCasesByGroup(kind: PracticeCase["kind"], group: string): PracticeCase[] {
  return practiceCasesByKind(kind).filter((practiceCase) => practiceCase.group === group);
}
