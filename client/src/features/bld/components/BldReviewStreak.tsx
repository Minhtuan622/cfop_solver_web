/* Bootstrap-only Study streak: derived only from actual self-grades recorded by BLD SRS. */
import { Trophy } from "@/components/ui/BootstrapIcon";
import { reviewStreak, type BldProfile } from "@/features/bld";

export function BldReviewStreak({ profile, language }: { profile: BldProfile; language: "vi" | "en" }) {
  const vi = language === "vi";
  const streak = reviewStreak(profile);
  const prompt = !profile.reviewDays.length ? (vi ? "Tự chấm một case để bắt đầu streak." : "Self-grade one case to start your streak.") : streak.reviewedToday ? (vi ? "Bạn đã giữ streak hôm nay." : "You kept today’s streak.") : (vi ? "Ôn một case hôm nay để nối streak." : "Review one case today to continue it.");
  return <section className="border rounded p-3 bg-body h-100"><div className="d-flex align-items-start justify-content-between gap-2"><div><p className="small text-uppercase fw-semibold text-body-secondary mb-1">{vi ? "STREAK ÔN TẬP" : "REVIEW STREAK"}</p><div className="d-flex align-items-end gap-2"><strong className="display-6 lh-1">{streak.current}</strong><span className="small text-body-secondary pb-1">{vi ? "ngày liên tục" : "days in a row"}</span></div></div><Trophy className="fs-4 text-warning" /></div><p className="small text-body-secondary mt-2 mb-0">{prompt}</p><div className="small text-body-secondary border-top pt-2 mt-2">{vi ? "Kỷ lục" : "Best"}: <strong>{streak.longest}</strong> {vi ? "ngày" : "days"}</div></section>;
}
