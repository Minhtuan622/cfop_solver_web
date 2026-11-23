import { Link } from "wouter";
import { BookOpenCheck } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";

/** Tóm tắt tiến độ Học thêm (BLD, Last Layer) kèm lối vào trang Học thêm. */
export function ProfileStudySummary({
  dueMemoCount,
  streakDays,
  bldReviewedCount,
  lastLayerCount,
}: {
  dueMemoCount: number;
  streakDays: number;
  bldReviewedCount: number;
  lastLayerCount: number;
}) {
  const { t } = useLanguage();
  return (
    <div className="rounded-card bg-surface mb-6">
      <div className="p-5 sm:p-6">
        <Eyebrow>Study</Eyebrow>
        <h2 className="text-lg font-semibold tracking-tight mb-1">
          {t("profile.studyTitle")}
        </h2>
        <p className="text-sm text-muted mb-4">
          {t("profile.studyHint")}
        </p>
        <div className="bg-transparent">
          <div className="block px-4 py-3 text-sm px-0 flex justify-between">
            <span>{t("profile.studyBldDue")}</span>
            <strong>{dueMemoCount}</strong>
          </div>
          <div className="block px-4 py-3 text-sm px-0 flex justify-between">
            <span>{t("profile.studyBldStreak")}</span>
            <strong>
              {t("profile.studyBldStreakValue", {
                count: streakDays,
              })}
            </strong>
          </div>
          <div className="block px-4 py-3 text-sm px-0 flex justify-between">
            <span>{t("profile.studyBldReviewed")}</span>
            <strong>{bldReviewedCount}</strong>
          </div>
          <div className="block px-4 py-3 text-sm px-0 flex justify-between">
            <span>{t("profile.studyLastLayer")}</span>
            <strong>{lastLayerCount}</strong>
          </div>
        </div>
        <Link
          href="/study"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-surface text-ink hover:bg-surface-2 w-full mt-4"
        >
          <BookOpenCheck className="mr-2" />
          {t("profile.openStudy")}
        </Link>
      </div>
    </div>
  );
}
