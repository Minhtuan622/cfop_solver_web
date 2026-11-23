import { useLanguage } from "@/contexts/LanguageContext";

/** Thanh nổi của chế độ chọn hàng loạt: số đã chọn, chọn tất cả/bỏ chọn, đánh dấu đã thuộc. */
export function CatalogBulkBar({
  selectedCount,
  total,
  onSelectAll,
  onClear,
  onMark,
}: {
  selectedCount: number;
  /** Tổng số case đang hiện trong nhóm. */
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  /** Đánh dấu các case đã chọn là đã thuộc (`true`) hoặc chưa thuộc (`false`). */
  onMark: (mastered: boolean) => void;
}) {
  const { t } = useLanguage();
  return (
      <div className="sticky bottom-3 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-full bg-ink px-4 py-2 text-canvas">
        <span className="text-xs font-semibold tabular-nums">
          {t("study.bulkSelected", {
            count: selectedCount,
            total,
          })}
        </span>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-xs font-semibold text-canvas/80 transition hover:bg-white/10 hover:text-canvas"
          onClick={onSelectAll}
        >
          {t("study.bulkSelectAll")}
        </button>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-xs font-semibold text-canvas/80 transition hover:bg-white/10 hover:text-canvas"
          onClick={onClear}
        >
          {t("study.bulkClear")}
        </button>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-warning px-3 py-1.5 text-xs font-semibold text-on-warning transition disabled:opacity-40"
            disabled={selectedCount === 0}
            onClick={() => onMark(true)}
          >
            {t("study.bulkMark", { count: selectedCount })}
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-canvas/90 transition hover:bg-white/10 disabled:opacity-40"
            disabled={selectedCount === 0}
            onClick={() => onMark(false)}
          >
            {t("study.bulkUnmark", { count: selectedCount })}
          </button>
        </span>
      </div>
  );
}
