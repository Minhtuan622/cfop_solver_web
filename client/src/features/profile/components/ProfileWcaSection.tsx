import { BoxArrowRight } from "@/components/ui/Icon";
import { Button, buttonClass } from "@/components/ui/Button";
import { RefreshIndicator, SkeletonCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import type { WcaProfileData } from "../lib/profilePresentation";
import { WcaProfileDetails } from "./WcaProfileDetails";

/** Phần WCA của trang Hồ sơ: hồ sơ đã liên kết và nút liên kết qua OAuth. */
export function ProfileWcaSection({
  wcaId,
  wcaProfile,
  refreshing,
  loading,
  entries,
  oauthConfigured,
  oauthPending,
  onStartOAuth,
}: {
  wcaId: string | null | undefined;
  wcaProfile: WcaProfileData | undefined;
  /** Đang tải lại khi đã có dữ liệu cũ. */
  refreshing: boolean;
  loading: boolean;
  entries: SolveHistoryEntry[];
  oauthConfigured: boolean | undefined;
  oauthPending: boolean;
  onStartOAuth: () => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="rounded-card bg-surface mb-6">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <p className="text-sm uppercase tracking-wide font-semibold text-primary mb-1">
              {t("profile.wcaEyebrow")}
            </p>
            <h2 className="text-lg font-semibold tracking-tight mb-1">
              {t("profile.wcaTitle")}
            </h2>
            <p className="text-sm text-muted mb-0">{t("profile.wcaHint")}</p>
          </div>
          {wcaId ? (
            <a
              className={`${buttonClass("secondary", "sm")}`}
              href={
                wcaProfile?.profileUrl ??
                `https://www.worldcubeassociation.org/persons/${wcaId}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {t("profile.wcaOpen")} <BoxArrowRight className="ml-1" />
            </a>
          ) : null}
        </div>
        {refreshing ? (
          <div className="mt-4">
            <RefreshIndicator label={t("profile.wcaRefreshing")} />
          </div>
        ) : null}
        {loading ? (
          <SkeletonCard
            lines={4}
            className="mt-4"
            label={t("profile.wcaLoading")}
          />
        ) : null}
        {wcaProfile ? (
          <WcaProfileDetails profile={wcaProfile} entries={entries} />
        ) : null}
        <div className="mt-6">
          <p className="text-sm mb-2">
            {oauthConfigured
              ? t("profile.wcaOauthReady")
              : t("profile.wcaOauthPending")}
          </p>
          <Button
            variant="secondary"
            size="sm"
            type="button"

            disabled={!oauthConfigured || oauthPending}
            onClick={onStartOAuth}
            >
            {oauthPending
              ? t("profile.wcaOauthLinkPending")
              : t("profile.wcaOauthLink")}
          </Button>
        </div>
      </div>
    </section>
  );
}
