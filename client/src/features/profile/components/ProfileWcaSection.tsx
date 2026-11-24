import { useState } from "react";
import { BoxArrowRight } from "@/components/ui/Icon";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { RefreshIndicator, SkeletonCard } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import type { WcaProfileData } from "../lib/profilePresentation";
import { WcaProfileDetails } from "./WcaProfileDetails";

export function ProfileWcaSection({
  wcaId,
  wcaProfile,
  refreshing,
  loading,
  entries,
  oauthConfigured,
  oauthPending,
  onStartOAuth,
  unlinkPending,
  onUnlink,
}: {
  wcaId: string | null | undefined;
  wcaProfile: WcaProfileData | undefined;
  refreshing: boolean;
  loading: boolean;
  entries: SolveHistoryEntry[];
  oauthConfigured: boolean | undefined;
  oauthPending: boolean;
  onStartOAuth: () => void;
  unlinkPending: boolean;
  onUnlink: () => void;
}) {
  const { t } = useLanguage();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
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
            <div className="flex flex-wrap items-center gap-2">
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
              <Button
                variant="danger"
                size="sm"
                type="button"
                disabled={unlinkPending}
                onClick={() => setConfirmUnlink(true)}
              >
                {unlinkPending
                  ? t("profile.wcaUnlinkPending")
                  : t("profile.wcaUnlink")}
              </Button>
            </div>
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
      <Dialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>{t("profile.wcaUnlinkTitle")}</DialogTitle>
              <DialogDescription>{t("profile.wcaUnlinkDetail")}</DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              size="md"
              type="button"
              onClick={() => setConfirmUnlink(false)}
            >
              {t("profile.wcaUnlinkCancel")}
            </Button>
            <Button
              variant="dangerSolid"
              size="md"
              type="button"
              onClick={() => {
                setConfirmUnlink(false);
                onUnlink();
              }}
            >
              {t("profile.wcaUnlink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
