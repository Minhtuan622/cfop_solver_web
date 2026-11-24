import { BoxIcon, PencilSquare, Puzzle, Shuffle } from "@/components/ui/Icon";
import { PillBar, PillGroup } from "@/components/ui/DesignSystem";
import { useLanguage } from "@/contexts/LanguageContext";

export type SolverKind = "cfop" | "bld" | "fm";
export type SolverInputMode = "scramble" | "state";

export type SolverToolbarProps = {
  solverKind: SolverKind;
  onSolverKindChange: (kind: SolverKind) => void;
  mode: SolverInputMode;
  onModeChange: (mode: SolverInputMode) => void;
  loading: boolean;
  status: string;
  hideKind?: boolean;
};

export function SolverToolbar({
  solverKind,
  onSolverKindChange,
  mode,
  onModeChange,
  loading,
  status,
  hideKind = false,
}: SolverToolbarProps) {
  const { t } = useLanguage();
  return (
    <div role="toolbar" className="flex flex-wrap items-center gap-2">
      {hideKind ? null : (
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
            {
              value: "fm",
              label: t("home.tab.fm"),
              icon: <Shuffle aria-hidden="true" />,
            },
          ]}
        />
      </PillBar>
      )}
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
