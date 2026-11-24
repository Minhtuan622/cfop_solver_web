import { useLanguage } from "@/contexts/LanguageContext";
import { useCallback, useState, type KeyboardEvent } from "react";

export type DiagramLane =
  | "pyraminx"
  | "skewb"
  | "squareOne"
  | "fourByFourParity"
  | "fiveByFiveL2E"
  | "ftoL3t"
  | "fto2LookL3t"
  | "cfop"
  | "twoByTwo"
  | "lastLayer";

export type CaseDiagramImageProps = {
  lane: DiagramLane;
  state: string;
  label: string;
  compact?: boolean;
  onClick?: () => void;
  fallback: React.ReactNode;
};

export function CaseDiagramImage({
  lane,
  state,
  label,
  compact = false,
  onClick,
  fallback,
}: CaseDiagramImageProps) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const interactive = Boolean(onClick);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      onClick();
    },
    [onClick],
  );
  const id = state.split(":").slice(1).join(":");
  return (
    <div
      aria-label={t("study.previewOf", { label })}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={interactive ? t("study.enlargePreview", { label }) : undefined}
      className={interactive ? "w-full cursor-pointer" : "w-full"}
      style={{ width: "100%", maxWidth: compact ? "7rem" : "min(22rem, 100%)" }}
    >
      {failed ? (
        fallback
      ) : (
        <img
          src={`/diagrams/${lane}/${encodeURIComponent(id)}.svg`}
          alt=""
          draggable={false}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-auto w-full select-none rounded-2xl bg-ink"
        />
      )}
    </div>
  );
}
