import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CatalogExplorerPreviewProps } from "@/features/last-layer/components/CatalogExplorer";
import { useCallback, type KeyboardEvent } from "react";

const SOLVED =
  "U".repeat(9) + "R".repeat(9) + "F".repeat(9) + "D".repeat(9) + "L".repeat(9) + "B".repeat(9);

const DIM = "#2a3048";

const GRID: Array<Array<number | null>> = [
  [null, null, null, 0, 1, 2, null, null, null, null, null, null],
  [null, null, null, 3, 4, 5, null, null, null, null, null, null],
  [null, null, null, 6, 7, 8, null, null, null, null, null, null],
  [36, 37, 38, 18, 19, 20, 9, 10, 11, 45, 46, 47],
  [39, 40, 41, 21, 22, 23, 12, 13, 14, 48, 49, 50],
  [42, 43, 44, 24, 25, 26, 15, 16, 17, 51, 52, 53],
  [null, null, null, 27, 28, 29, null, null, null, null, null, null],
  [null, null, null, 30, 31, 32, null, null, null, null, null, null],
  [null, null, null, 33, 34, 35, null, null, null, null, null, null],
];

export function BldCasePreview({
  state,
  label,
  compact = false,
  onClick,
}: CatalogExplorerPreviewProps) {
  const { t } = useLanguage();
  const safe = state.length === 54 && /^[URFDLB]+$/.test(state) ? state : SOLVED;
  const interactive = Boolean(onClick);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      onClick();
    },
    [onClick],
  );

  return (
    <div
      aria-label={t("study.previewOf", { label })}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={interactive ? t("study.enlargePreview", { label }) : undefined}
      className={`flex items-center justify-center rounded-2xl bg-ink p-1.5 ${
        interactive ? "cursor-pointer" : ""
      }`}
      style={{
        width: "100%",
        maxWidth: compact ? "7rem" : "min(22rem, 100%)",
        aspectRatio: "12 / 9",
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "repeat(9, 1fr)",
          gap: compact ? "2px" : "4px",
        }}
        role="img"
        aria-label={t("study.previewOf", { label })}
      >
        {GRID.flat().map((index, cell) =>
          index === null ? (
            <span key={cell} aria-hidden="true" />
          ) : (
            <span
              key={cell}
              className={compact ? "rounded-[3px]" : "rounded-[5px]"}
              style={{
                backgroundColor:
                  safe[index] === SOLVED[index] ? DIM : (CUBE_COLORS[safe[index]!] ?? "#6b7280"),
              }}
            />
          ),
        )}
      </div>
    </div>
  );
}
