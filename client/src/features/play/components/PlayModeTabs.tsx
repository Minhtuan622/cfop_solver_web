import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { PlayMode } from "../lib/playTypes";

export function PlayModeTabs({
  mode,
  onChange,
}: {
  mode: PlayMode;
  onChange: (mode: PlayMode) => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      role="tablist"
      aria-label={t("play.modeLabel")}
      className="inline-flex rounded-full bg-surface-2 p-1"
    >
      {(
        [
          { id: "free", label: t("play.modeFree") },
          { id: "race", label: t("play.modeRace") },
        ] as const
      ).map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={mode === tab.id}
          onClick={event => {
            onChange(tab.id);
            event.currentTarget.blur();
          }}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
            mode === tab.id
              ? "bg-primary text-on-primary"
              : "text-muted hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
