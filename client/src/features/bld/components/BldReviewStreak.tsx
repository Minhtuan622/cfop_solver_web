/* Tailwind-only Study streak: derived only from actual self-grades recorded by BLD SRS. */
import { Trophy } from "@/components/ui/Icon";
import { reviewStreak, type BldProfile } from "@/features/bld";

export function BldReviewStreak({
  profile,
  language,
}: {
  profile: BldProfile;
  language: "vi" | "en";
}) {
  const vi = language === "vi";
  const streak = reviewStreak(profile);
  const prompt = !profile.reviewDays.length
    ? vi
      ? "Tự chấm một case để bắt đầu streak."
      : "Self-grade one case to start your streak."
    : streak.reviewedToday
      ? vi
        ? "Bạn đã giữ streak hôm nay."
        : "You kept today’s streak."
      : vi
        ? "Ôn một case hôm nay để nối streak."
        : "Review one case today to continue it.";
  return (
    <section className="rounded-xl p-4 bg-surface h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide font-semibold text-muted mb-1">
            {vi ? "STREAK ÔN TẬP" : "REVIEW STREAK"}
          </p>
          <div className="flex items-end gap-2">
            <strong className="text-3xl font-bold tracking-tight sm:text-4xl leading-none">
              {streak.current}
            </strong>
            <span className="text-sm text-muted pb-1">
              {vi ? "ngày liên tục" : "days in a row"}
            </span>
          </div>
        </div>
        <Trophy className="text-xl text-warning" />
      </div>
      <p className="text-sm text-muted mt-2 mb-0">{prompt}</p>
      <div className="text-sm text-muted mt-2">
        {vi ? "Kỷ lục" : "Best"}: <strong>{streak.longest}</strong>{" "}
        {vi ? "ngày" : "days"}
      </div>
    </section>
  );
}
