import { Trash2 } from "@/components/ui/Icon";
import { IconButton, StatTile } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  formatPlayTime,
  playEffectiveTime,
  playStats,
  type PlayHistoryEntry,
} from "../lib/playHistory";

/** Lịch sử riêng của trang Chơi: số liệu, 12 lượt gần nhất, xoá từng lượt hoặc tất cả. */
export function PlayHistoryPanel({
  entries,
  onDelete,
  onClear,
}: {
  entries: PlayHistoryEntry[];
  onDelete: (id: string) => void;
  /** Mở hộp thoại xác nhận xoá tất cả. */
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const stats = playStats(entries);
  const bestText = stats.bestMs !== null ? formatPlayTime(stats.bestMs) : "—";
  const ao5Text = stats.ao5Ms !== null ? formatPlayTime(stats.ao5Ms) : "—";
  return (
    <div className="rounded-card bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="mb-0 text-base font-semibold tracking-tight text-ink">
          {t("play.historyTitle")}
        </h2>
        {entries.length > 0 ? (
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger-soft focus-visible:ring-4 focus-visible:ring-primary/20"
            onClick={onClear}
          >
            {t("play.clearAll")}
          </button>
        ) : null}
      </div>
      <p className="mb-0 mt-1 text-xs text-muted">{t("play.historyNote")}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatTile compact label={t("play.best")} value={bestText} />
        <StatTile compact label={t("play.ao5")} value={ao5Text} />
        <StatTile compact label={t("play.solves")} value={String(stats.count)} />
      </div>

      {entries.length === 0 ? (
        <p className="mb-0 mt-4 rounded-panel bg-surface-2 px-4 py-6 text-center text-sm text-muted">
          {t("play.historyEmpty")}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {entries.slice(0, 12).map(entry => {
            const effective = playEffectiveTime(entry);
            return (
              <li
                key={entry.id}
                className="group flex items-center gap-3 rounded-panel px-2 py-2 transition-colors hover:bg-surface-2"
              >
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {effective !== null ? formatPlayTime(effective) : "DNF"}
                </span>
                {entry.penalty !== "none" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      entry.penalty === "+2"
                        ? "bg-warning-soft text-ink"
                        : "bg-danger-soft text-danger"
                    )}
                  >
                    {entry.penalty}
                  </span>
                ) : null}
                <span className="text-[11px] text-muted">
                  {t("play.movesLabel", { count: entry.moves })}
                </span>
                <span className="ml-auto text-[11px] text-muted">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
                <IconButton
                  label={t("play.deleteSolve")}
                  icon={<Trash2 className="text-base" />}
                  onClick={() => onDelete(entry.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
