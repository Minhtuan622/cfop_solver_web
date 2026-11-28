import { Link } from "wouter";
import { BadgeCheck, KeyRound, Link2Off, Pencil, Target, Timer } from "@/components/ui/Icon";
import { Button, buttonClass } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { initials } from "../lib/profilePresentation";

const chipClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

export function ProfileHero({
  account,
  wcaId,
  goalLabel,
  onEdit,
  onChangePassword,
}: {
  account: { displayName: string; bio?: string | null; avatarUrl?: string | null };
  wcaId: string | null | undefined;
  goalLabel: string;
  onEdit: () => void;
  onChangePassword: () => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="rounded-card bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="grid size-[72px] shrink-0 place-items-center overflow-hidden rounded-full bg-surface-3 text-2xl font-semibold text-ink"
            aria-label={t("profile.avatarAlt")}
          >
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt={t("profile.avatarAlt")} className="h-full w-full object-cover" />
            ) : (
              initials(account.displayName)
            )}
          </div>
          <div className="min-w-0">
            <Eyebrow>{t("profile.eyebrow")}</Eyebrow>
            <h1 className="m-0 mt-1 break-words text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {account.displayName}
            </h1>
            <p className="m-0 mt-1 text-sm text-muted">{account.bio || t("profile.bioFallback")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {wcaId ? (
                <span className={`${chipClass} bg-success-soft text-success`}>
                  <BadgeCheck className="text-sm" aria-hidden="true" />
                  {t("profile.wcaChipLinked", { id: wcaId })}
                </span>
              ) : (
                <span className={`${chipClass} bg-warning-soft text-warning`}>
                  <Link2Off className="text-sm" aria-hidden="true" />
                  {t("profile.wcaChipUnlinked")}
                </span>
              )}
              <span className={`${chipClass} bg-surface-2 text-muted`}>
                <Target className="text-sm" aria-hidden="true" />
                {t("profile.goalChip", { goal: goalLabel })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Link href="/timer" className={buttonClass("primary", "md")}>
            <Timer aria-hidden="true" />
            {t("profile.openTimer")}
          </Link>
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden="true" />
            {t("profile.editProfile")}
          </Button>
          <Button variant="soft" onClick={onChangePassword}>
            <KeyRound aria-hidden="true" />
            {t("profile.changePassword")}
          </Button>
        </div>
      </div>
    </section>
  );
}
