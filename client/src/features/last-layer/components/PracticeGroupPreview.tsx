/**
 * Flat 3×3 U-face preview — the representative face for every
 * last-layer-family case (LL, OLL/PLL/COLL/OLLCP). Shares the same visual
 * language as the rest of the study previews: deep ink card, nine flat
 * stickers, no borders or shadows.
 */
import { CUBE_COLOR } from "@/components/common/CubeNet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { KeyboardEvent } from "react";

type Props = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
};

export function PracticeGroupPreview({
  state,
  label,
  compact = false,
  onClick,
}: Props) {
  const { t } = useLanguage();
  const stickers =
    state.length >= 9
      ? state.slice(0, 9).split("")
      : Array.from({ length: 9 }, () => "U");
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
        className="grid h-full w-full grid-cols-3 m-0"
        style={{ gap: compact ? "3px" : "6px" }}
        role="img"
        aria-label={t("study.previewFace", { label })}
      >
        {stickers.map((sticker, index) => (
          <span
            key={`${sticker}-${index}`}
            className={compact ? "rounded-md p-0" : "rounded-lg p-0"}
            style={{ backgroundColor: CUBE_COLOR[sticker] ?? "#6c757d" }}
          />
        ))}
      </div>
    </div>
  );
}
