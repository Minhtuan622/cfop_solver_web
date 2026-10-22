import { CUBE_COLOR } from "@/components/common/CubeNet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { KeyboardEvent } from "react";

type Props = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
};

export function PracticeGroupPreview({ state, label, compact = false, onClick }: Props) {
  const { t } = useLanguage();
  const stickers = state.length >= 9 ? state.slice(0, 9).split("") : Array.from({ length: 9 }, () => "U");
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
      className={`${compact ? "d-flex flex-shrink-0 align-items-center justify-content-center rounded-2 cfop-stage p-2" : "d-flex align-items-center justify-content-center rounded-2 cfop-stage p-2"}${interactive ? " cursor-pointer" : ""}`}
      style={{ width: compact ? "5.25rem" : "min(22rem, 100%)", aspectRatio: "1" }}
    >
      <div className="ratio ratio-1x1 w-100" role="img" aria-label={t("study.previewFace", { label })}>
        <div className="row row-cols-3 g-1 m-0 h-100">
          {stickers.map((sticker, index) => (
            <span
              key={`${sticker}-${index}`}
              className="col p-0 border border-dark-subtle rounded-1"
              style={{ backgroundColor: CUBE_COLOR[sticker] ?? "#6c757d" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
