/* Tailwind-only Study suggestion: rank actual due SRS prompts before upcoming prompts, with an honest empty state. */
import {
  dueMemoRecords,
  reviewedToday,
  type BldMemoRecord,
  type BldProfile,
} from "@/features/bld";
import { useMemo } from "react";
import { BldReviewStreak } from "@/features/bld";

function formatDue(record: BldMemoRecord, vi: boolean) {
  if (!record.dueAt) return vi ? "Sẵn sàng ôn" : "Ready to review";
  const delta = record.dueAt - Date.now();
  if (delta <= 0) return vi ? "Đến hạn" : "Due now";
  const hours = Math.max(1, Math.ceil(delta / 3_600_000));
  return vi ? `Sau khoảng ${hours} giờ` : `In about ${hours} hours`;
}

export function BldNextReview({
  profile,
  language,
}: {
  profile: BldProfile;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const recommendation = useMemo(() => {
    const due = dueMemoRecords(profile);
    if (due[0])
      return { record: due[0], label: vi ? "CASE NÊN ÔN NGAY" : "REVIEW NEXT" };
    const upcoming = Object.values(profile.memoRecords).sort(
      (left, right) => left.dueAt - right.dueAt
    )[0];
    return upcoming
      ? { record: upcoming, label: vi ? "CASE SẮP ĐẾN HẠN" : "UPCOMING CASE" }
      : null;
  }, [profile, vi]);
  const reviewed = reviewedToday(profile);
  return (
    <section className="rounded-card border border-line/80 bg-surface shadow-soft mb-6">
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
                  {vi ? "GỢI Ý SRS" : "SRS SUGGESTION"}
                </p>
                <h3 className="text-sm font-semibold tracking-tight mb-1">
                  {vi ? "Case kế tiếp" : "Next case"}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                {reviewed}/{profile.dailyGoal}
              </span>
            </div>
            {recommendation ? (
              <div className="rounded-card border border-line/80 bg-surface shadow-soft bg-surface-2 mt-4">
                <div className="p-5 sm:p-6">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide bg-surface-3 text-ink">
                    {recommendation.label}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight font-mono mt-2 mb-1">
                    {recommendation.record.memo}
                  </h4>
                  <p className="text-sm text-muted mb-0">
                    {recommendation.record.kind.toUpperCase()} ·{" "}
                    {formatDue(recommendation.record, vi)} ·{" "}
                    {recommendation.record.lapses} {vi ? "lần quên" : "lapses"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-panel border px-4 py-3 text-sm border-line bg-surface-2 text-ink mt-4 mb-0">
                {vi
                  ? "Chưa có case SRS. Hoàn thành bài sighted-commutator hoặc tự chấm một memo để tạo case ôn đầu tiên."
                  : "There is no SRS case yet. Complete the sighted-commutator exercise or self-grade one memo to create a first review."}
              </div>
            )}
            <p className="text-sm text-muted mt-4 mb-0">
              {vi
                ? "Case này ưu tiên theo hạn ôn, sau đó theo số lần quên. Dùng Memo SRS để reveal và tự chấm."
                : "This case is ranked by due time, then lapse count. Use Memo SRS to reveal and self-grade it."}
            </p>
          </div>
          <aside className="col-span-12 lg:col-span-5">
            <BldReviewStreak profile={profile} language={language} />
          </aside>
        </div>
      </div>
    </section>
  );
}
