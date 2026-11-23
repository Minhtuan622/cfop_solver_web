import { Pencil, Trash2 } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  formatSolveResult,
  type SolveHistoryEntry,
  type SolvePenalty,
} from "@/lib/solveHistory";
import { normalizeTimerEventId, timerEventLabel } from "@/lib/timerEvents";
import { cn } from "@/lib/utils";

/** Thẻ một lượt giải trong danh sách Lịch sử: kết quả, scramble, tag và thao tác. */
export function SolveCard({
  item,
  language,
  selected,
  onSelect,
  onPenalty,
  onEdit,
  onDelete,
}: {
  item: SolveHistoryEntry;
  language: "vi" | "en";
  selected: boolean;
  onSelect: () => void;
  onPenalty: (item: SolveHistoryEntry, penalty: SolvePenalty) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const bundle = item.multiBlindScrambles;
  const eventLabel = timerEventLabel(
    normalizeTimerEventId(item.eventId),
    language
  );
  const date = new Date(item.createdAt).toLocaleString(
    language === "vi" ? "vi-VN" : "en-US",
    { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
  const penaltyButton = (penalty: SolvePenalty, label: string, activeClass: string) => (
    <button
      type="button"
      onClick={() => onPenalty(item, penalty)}
      aria-pressed={item.penalty === penalty}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20",
        item.penalty === penalty ? activeClass : "text-muted hover:bg-surface-3 hover:text-ink"
      )}
    >
      {label}
    </button>
  );
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-panel p-4 transition-colors",
        selected ? "bg-primary-soft" : "bg-surface-2"
      )}
    >
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded accent-primary"
          checked={selected}
          onChange={onSelect}
          aria-label={t("history.selectSolve")}
        />
        <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold leading-none text-primary">
          {eventLabel}
        </span>
        <span className="ml-auto text-xs tabular-nums text-muted">{date}</span>
      </div>

      <div>
        <strong
          className={cn(
            "block text-2xl font-semibold tabular-nums tracking-tight",
            item.penalty === "DNF" ? "text-danger" : "text-ink"
          )}
        >
          {formatSolveResult(item)}
        </strong>
        <p className="mb-0 mt-0.5 text-xs text-muted">
          {[
            item.inspectionMs
              ? `Inspection ${(item.inspectionMs / 1000).toFixed(1)}s`
              : null,
            item.moves ? t("history.moveCount", { count: item.moves }) : null,
            item.note || null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {bundle?.length ? (
        <details className="text-sm">
          <summary className="cursor-pointer font-mono text-muted">
            {t("history.multiBlindBundle", { count: bundle.length })}
          </summary>
          <ol className="mb-0 mt-2 pl-5 font-mono text-xs">
            {bundle.map((scramble, index) => (
              <li key={`${index}-${scramble}`} className="break-words">
                {scramble}
              </li>
            ))}
          </ol>
        </details>
      ) : (
        <p
          className="mb-0 line-clamp-2 break-words font-mono text-xs leading-relaxed text-muted"
          title={item.inputKind === "scramble" ? item.input : undefined}
        >
          {item.inputKind === "scramble" ? item.input : t("history.sixFaceState")}
        </p>
      )}

      {item.tags.length ? (
        <div className="flex flex-wrap gap-1">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-semibold leading-none text-ink"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-1">
        {penaltyButton("+2", "+2", "bg-warning-soft text-ink")}
        {penaltyButton("DNF", "DNF", "bg-danger-soft text-danger")}
        <IconButton
          label={t("history.editSolve")}
          icon={<Pencil className="text-base" />}
          onClick={onEdit}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-3 hover:text-ink"
        />
        <IconButton
          label={t("history.deleteRow")}
          icon={<Trash2 className="text-base" />}
          onClick={onDelete}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-danger transition hover:bg-danger-soft"
        />
      </div>
    </article>
  );
}
