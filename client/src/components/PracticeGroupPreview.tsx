import { CUBE_COLOR } from "@/components/CubeNet";
import type { KeyboardEvent } from "react";

type Props = {
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
};

export function PracticeGroupPreview({ state, label, compact = false, onClick }: Props) {
  const stickers = state.length >= 9 ? state.slice(0, 9).split("") : Array.from({ length: 9 }, () => "U");
  const interactive = Boolean(onClick);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    onClick();
  };
  return (
    <div
      aria-label={`Preview ${label}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={interactive ? `Phóng to preview ${label}` : undefined}
      className={`${compact ? "d-flex flex-shrink-0 align-items-center justify-content-center rounded-2 bg-dark p-2" : "d-flex align-items-center justify-content-center rounded-2 bg-dark p-2"}${interactive ? " cursor-pointer" : ""}`}
      style={{ width: compact ? "5.25rem" : "min(22rem, 100%)", height: compact ? "5.25rem" : "min(22rem, 100%)" }}
    >
      <div className="ratio ratio-1x1 w-100" role="img" aria-label={`${label}: mặt trên 3x3`}>
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
