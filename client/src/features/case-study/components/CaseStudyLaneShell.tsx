/**
 * Bố cục chung của một lane Học thêm: nút chọn bộ (nếu lane có nhiều bộ), câu
 * tóm tắt, nút nhập/xuất backup, thẻ luyện case, lịch ôn tuần và catalog.
 * Lane truyền vào phần riêng (thẻ case, catalog, nhãn); state lấy từ
 * `useCaseStudyLane`.
 */
import type { ReactNode } from "react";
import { Download, FileUp } from "@/components/ui/Icon";
import { StatusFeedback } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { StudySchedulePanel } from "@/features/last-layer/components/StudySchedulePanel";
import type { CaseStudyLane } from "../useCaseStudyLane";

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export type CaseStudySetPicker<Family extends string> = {
  /** Accessible name của nhóm nút chọn bộ. */
  label: string;
  options: readonly { value: Family; label: string }[];
  value: Family;
  onChange: (value: Family) => void;
};

export function CaseStudyLaneShell<Family extends string>({
  lane,
  setPicker,
  summary,
  backupFileName,
  exportBackup,
  casePanel,
  catalogPanel,
}: {
  lane: Pick<
    CaseStudyLane,
    | "backupRef"
    | "onImport"
    | "resetActiveCase"
    | "importError"
    | "weeklySchedule"
    | "weeklyTotal"
    | "weakCaseCount"
    | "reviewWeakest"
    | "celebrated"
    | "dismissCelebration"
  >;
  /** Nút chọn bộ; bỏ trống khi lane chỉ có một bộ. */
  setPicker?: CaseStudySetPicker<Family>;
  summary: ReactNode;
  /** Tên file khi xuất backup, ví dụ `cfop-skewb-study-backup.json`. */
  backupFileName: string;
  /** Dữ liệu backup (từ `export…Study`). */
  exportBackup: () => unknown;
  casePanel: ReactNode;
  catalogPanel: ReactNode;
}) {
  const { t } = useLanguage();

  const backupActions = (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={lane.backupRef}
        onChange={lane.onImport}
        accept="application/json,.json"
        type="file"
        className="hidden"
        aria-label={t("study.importProgress")}
      />
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => lane.backupRef.current?.click()}
      >
        <FileUp className="text-base mr-1" />
        {t("study.importProgress")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => download(backupFileName, exportBackup())}
      >
        <Download className="text-base mr-1" />
        {t("study.exportBackup")}
      </Button>
    </div>
  );

  return (
    <div>
      {setPicker ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={setPicker.label}>
              {setPicker.options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={setPicker.value === option.value}
                  onClick={() => {
                    setPicker.onChange(option.value);
                    lane.resetActiveCase();
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20 ${
                    setPicker.value === option.value
                      ? "bg-primary text-on-primary hover:bg-primary-hover"
                      : "bg-surface-2 text-ink hover:bg-surface-3"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted">{summary}</div>
            {backupActions}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted">{summary}</div>
          {backupActions}
        </div>
      )}

      {lane.importError ? (
        <div className="mt-4">
          <StatusFeedback tone="danger" title={t("study.importErrorTitle")}>
            {lane.importError}
          </StatusFeedback>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">{casePanel}</div>
        <div className="col-span-12 xl:col-span-4">
          <StudySchedulePanel
            schedule={lane.weeklySchedule}
            totalDue={lane.weeklyTotal}
            weakCaseCount={lane.weakCaseCount}
            onReviewWeakest={lane.reviewWeakest}
            celebration={lane.celebrated}
            onDismissCelebration={lane.dismissCelebration}
          />
        </div>
      </div>

      <div className="mt-6">{catalogPanel}</div>
    </div>
  );
}
