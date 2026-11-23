import { BoxIcon, PencilSquare, Puzzle, Shuffle } from "@/components/ui/Icon";
import { PillBar, PillGroup } from "@/components/ui/DesignSystem";
import { useLanguage } from "@/contexts/LanguageContext";

export type SolverKind = "cfop" | "bld";
export type SolverInputMode = "scramble" | "state";

export type SolverToolbarProps = {
  solverKind: SolverKind;
  onSolverKindChange: (kind: SolverKind) => void;
  mode: SolverInputMode;
  onModeChange: (mode: SolverInputMode) => void;
  loading: boolean;
  status: string;
};

/**
 * Two pill bars: which solver (CFOP / BLD), then which input (scramble / cube state).
 * The engine status stays in a screen-reader-only live region; the visible
 * status lives in the green banner under the cube.
 */
export function SolverToolbar({
  solverKind,
  onSolverKindChange,
  mode,
  onModeChange,
  loading,
  status,
}: SolverToolbarProps) {
  const { t } = useLanguage();
  return (
    // Hai nhóm tách riêng: chọn bộ giải (nút đặc màu nhấn) và chọn cách nhập
    // (kiểu nhạt), để không có hai nút xanh đặc tranh nhau trên một thanh.
    <div role="toolbar" className="flex flex-wrap items-center gap-2">
      <PillBar>
        <PillGroup<SolverKind>
          label={t("home.modeLabel")}
          value={solverKind}
          onChange={onSolverKindChange}
          options={[
            {
              value: "cfop",
              label: t("home.tab.solve"),
              icon: <BoxIcon aria-hidden="true" />,
            },
            {
              value: "bld",
              label: t("home.tab.bld"),
              icon: <Puzzle aria-hidden="true" />,
            },
          ]}
        />
      </PillBar>
      <PillBar>
        <PillGroup<SolverInputMode>
          tone="soft"
          label={t("home.inputLabel")}
          value={mode}
          onChange={onModeChange}
          options={[
            {
              value: "scramble",
              label: t("home.modeScramble"),
              icon: <Shuffle aria-hidden="true" />,
            },
            {
              value: "state",
              label: t("home.modeState"),
              icon: <PencilSquare aria-hidden="true" />,
            },
          ]}
        />
      </PillBar>
      <span className="sr-only" role="status" aria-live="polite">
        {loading ? status : t("home.ready")}
      </span>
    </div>
  );
}
