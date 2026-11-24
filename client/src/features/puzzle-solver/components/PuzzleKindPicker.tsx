import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  OTHER_PUZZLES,
  OTHER_PUZZLE_IDS,
  type OtherPuzzleId,
} from "../lib/puzzleSolve";

/** Chế độ giải 3×3 (cùng một khối, ba cách giải). */
export type CubeSolveMode = "cfop" | "bld" | "fm";
/** Một lựa chọn trong dropdown: chế độ 3×3 hoặc một khối khác. */
export type SolveChoice = CubeSolveMode | Exclude<OtherPuzzleId, "333fm">;

const CUBE_MODES: Array<{ value: CubeSolveMode; labelKey: string }> = [
  { value: "cfop", labelKey: "home.tab.solve" },
  { value: "bld", labelKey: "home.tab.bld" },
  { value: "fm", labelKey: "home.tab.fm" },
];

export function isCubeSolveMode(value: SolveChoice): value is CubeSolveMode {
  return CUBE_MODES.some(mode => mode.value === value);
}

/**
 * Một dropdown chọn việc cần giải ở đầu trang Giải: ba chế độ 3×3 (CFOP, BLD,
 * FM) rồi các khối khác. Thêm khối mới chỉ cần thêm một dòng vào `OTHER_PUZZLES`.
 */
export function PuzzleKindPicker({
  value,
  onChange,
}: {
  value: SolveChoice;
  onChange: (next: SolveChoice) => void;
}) {
  const { t } = useLanguage();
  return (
    <Select
      aria-label={t("otherPuzzles.puzzle")}
      className="w-auto"
      buttonClassName="h-10 min-w-40 rounded-full bg-surface-2 px-4 py-0 text-sm font-semibold"
      value={value}
      onChange={event => onChange(event.target.value as SolveChoice)}
    >
      {CUBE_MODES.map(mode => (
        <option key={mode.value} value={mode.value}>
          {t(mode.labelKey)}
        </option>
      ))}
      {OTHER_PUZZLE_IDS.map(id => (
        <option key={id} value={id}>
          {t(OTHER_PUZZLES[id].labelKey)}
        </option>
      ))}
    </Select>
  );
}
