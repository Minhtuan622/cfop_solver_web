/**
 * Đọc kết quả của bộ giải CFOP theo vị trí con trỏ: phase đang ở, các slot
 * XCross cần tô, case Last Layer đang chạy và tóm tắt bước mở đầu.
 */
import type { SolverResult } from "@/lib/solverRuntime";

type Phase = SolverResult["phases"][number];

/**
 * Phase chứa lượt thứ `position` (1-based). Lượt cuối của một phase thuộc về
 * phase đó; vị trí 0 (trước lượt đầu) không thuộc phase nào.
 */
export function phaseAt(result: SolverResult | null, position: number): Phase | null {
  if (!result || position <= 0) return null;
  return (
    result.phases.find(phase => position > phase.start && position <= phase.end) ??
    result.phases.find(phase => phase.end === position) ??
    null
  );
}

const OPENING_PREFIXES = ["xxxxcross_", "xxxcross_", "xxcross_"] as const;

/** Các slot F2L mà phase mở đầu (XCross..XXXXCross) đã giải cùng Cross. */
export function xcrossSlotsOf(phaseName: string | undefined): string[] | undefined {
  if (!phaseName) return undefined;
  for (const prefix of OPENING_PREFIXES) {
    if (phaseName.startsWith(prefix)) return phaseName.slice(prefix.length).split("_");
  }
  if (phaseName.startsWith("xcross_")) return [phaseName.slice("xcross_".length)];
  return undefined;
}

/** Case ZBLL/1LLL của phase (để vẽ sơ đồ), nếu có. */
export function lastLayerCaseOf(phase: Phase | null) {
  return phase &&
    (phase.name === "zbll" || phase.name === "1lll") &&
    phase.case_id
    ? { family: phase.name, id: phase.case_id }
    : undefined;
}

export type OpeningOutcome =
  | { kind: "xxxxcross" | "xxxcross" | "xxcross"; slots: string[]; moves: number }
  | { kind: "xcross"; slot: string; moves: number }
  | { kind: "cross"; slot: null; moves: number };

/** Kết quả bước mở đầu (phase đầu tiên): loại, slot và số lượt. */
export function openingOutcomeOf(result: SolverResult | null): OpeningOutcome | null {
  const first = result?.phases[0];
  if (!first) return null;
  for (const prefix of OPENING_PREFIXES) {
    if (first.name.startsWith(prefix))
      return {
        kind: prefix.slice(0, -1) as "xxxxcross" | "xxxcross" | "xxcross",
        slots: first.name.slice(prefix.length).split("_"),
        moves: first.moves.length,
      };
  }
  if (first.name.startsWith("xcross_"))
    return {
      kind: "xcross",
      slot: first.name.slice("xcross_".length),
      moves: first.moves.length,
    };
  return { kind: "cross", slot: null, moves: first.moves.length };
}
