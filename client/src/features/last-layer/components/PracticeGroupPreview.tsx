import { CUBE_COLOR } from "@/components/common/CubeNet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { KeyboardEvent } from "react";

type Props = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
};

const SOLVED =
  "U".repeat(9) +
  "R".repeat(9) +
  "F".repeat(9) +
  "D".repeat(9) +
  "L".repeat(9) +
  "B".repeat(9);

export function PracticeGroupPreview({
  state,
  label,
  compact = false,
  onClick,
}: Props) {
  const { t } = useLanguage();
  const safe = state.length === 54 ? state : SOLVED;
  const cells: Array<string | null> = [
    null, safe[45], safe[46], safe[47], null,
    safe[36], safe[0], safe[1], safe[2], safe[9],
    safe[37], safe[3], safe[4], safe[5], safe[10],
    safe[38], safe[6], safe[7], safe[8], safe[11],
    null, safe[18], safe[19], safe[20], null,
  ];
  const interactive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };
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
        aspectRatio: "1",
      }}
    >
      <div
        className="grid h-full w-full grid-cols-5 grid-rows-5 m-0"
        style={{ gap: compact ? "3px" : "6px" }}
        role="img"
        aria-label={t("study.previewFace", { label })}
      >
        {cells.map((sticker, index) =>
          sticker ? (
            <span
              key={index}
              className={compact ? "rounded-md" : "rounded-lg"}
              style={{ backgroundColor: CUBE_COLOR[sticker] ?? "#6c757d" }}
            />
          ) : (
            <span key={index} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}
