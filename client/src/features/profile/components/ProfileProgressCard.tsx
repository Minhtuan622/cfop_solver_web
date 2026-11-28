import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileProgressChart } from "./ProfileProgressChart";
import type { ProfileProgressRange } from "../lib/profileProgress";

export function ProfileProgressCard({
  progressRange,
  onProgressRangeChange,
  data,
}: {
  progressRange: ProfileProgressRange;
  onProgressRangeChange: (range: ProfileProgressRange) => void;
  data: Parameters<typeof ProfileProgressChart>[0]["data"];
}) {
  const { t } = useLanguage();
  return (
    <section className="col-span-12 lg:col-span-8">
      <div className="rounded-card bg-surface h-full">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap justify-between items-end gap-2 mb-6">
            <div>
              <Eyebrow>{t("profile.progressEyebrow")}</Eyebrow>
              <h2 className="text-lg font-semibold tracking-tight mb-1">
                {t("profile.progressTitle")}
              </h2>
              <p className="text-muted text-sm mb-0">
                {t("profile.progressHint")}
              </p>
            </div>
            <div
              className="inline-flex flex-wrap items-center gap-1"
              role="group"
              aria-label={t("profile.progressRangeLabel")}
            >
              {(["7d", "30d", "all"] as ProfileProgressRange[]).map(
                range => (
                  <Button
                    variant={
                      progressRange === range ? "primary" : "secondary"
                    }
                    size="sm"
                    key={range}
                    type="button"

                    onClick={() => onProgressRangeChange(range)}
                  >
                    {range === "7d"
                      ? t("profile.range7d")
                      : range === "30d"
                        ? t("profile.range30d")
                        : t("profile.rangeAll")}
                  </Button>
                )
              )}
            </div>
          </div>
          <ProfileProgressChart data={data} />
        </div>
      </div>
    </section>
  );
}
