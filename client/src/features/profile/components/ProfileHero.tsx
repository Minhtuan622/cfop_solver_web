import { Link } from "wouter";
import { Clock3, Timer } from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { initials } from "../lib/profilePresentation";

export function ProfileHero({
  account,
  goalLabel,
}: {
  account: { displayName: string; bio?: string | null; avatarUrl?: string | null };
  goalLabel: string;
}) {
  const { t } = useLanguage();
  return (
    <section className="rounded-card bg-surface mb-6 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-12 items-center gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-4">
              <div
                className="rounded-full bg-surface-2 text-muted flex items-center justify-center overflow-hidden shrink-0"
                style={{ width: 88, height: 88 }}
                aria-label={t("profile.avatarAlt")}
              >
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt={t("profile.avatarAlt")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold">
                    {initials(account.displayName)}
                  </span>
                )}
              </div>
              <div>
                <Eyebrow>{t("profile.eyebrow")}</Eyebrow>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-semibold mb-2">
                  {account.displayName}
                </h1>
                <p className="text-muted mb-0">
                  {account.bio || t("profile.bioFallback")}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-12">
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href="/timer"
                className={`${buttonClass("primary", "md")}`}
              >
                <Timer className="mr-2" />
                {t("profile.openTimer")}
              </Link>
              <Link
                href="/history"
                className={`${buttonClass("secondary", "md")}`}
              >
                <Clock3 className="mr-2" />
                {t("profile.openHistory")}
              </Link>
            </div>
            <p className="text-sm text-muted lg:text-right mb-0 mt-2">
              {t("profile.goalLabelPrefix")} <strong>{goalLabel}</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
