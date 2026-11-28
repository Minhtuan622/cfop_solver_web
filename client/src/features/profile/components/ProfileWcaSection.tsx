import { useState } from "react";
import { AlertTriangle, ExternalLink, Globe, LogIn, Unlink } from "@/components/ui/Icon";
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
  const linkButton = (
    <Button
      variant="primary"
      type="button"
      disabled={oauthConfigured !== true || oauthPending}
      onClick={onStartOAuth}
    >
      <LogIn aria-hidden="true" />
      {oauthPending ? t("profile.wcaOauthLinkPending") : t("profile.wcaOauthLink")}
    </Button>
  );
  return (
    <section className="rounded-card bg-surface">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-2xl ${wcaId ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}
            >
              <Globe aria-hidden="true" className="text-xl" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t("profile.wcaEyebrow")}
              </p>
              <h2 className="m-0 mt-1 text-lg font-semibold tracking-tight text-ink">
                {wcaId ? t("profile.wcaTitle") : t("profile.wcaLinkTitle")}
              </h2>
              <p className="m-0 mt-1 text-sm text-muted">
                {wcaId ? wcaId : t("profile.wcaLinkHint")}
              </p>
            </div>
          </div>
          {wcaId ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                className={buttonClass("outline", "md")}
                href={wcaProfile?.profileUrl ?? `https://www.worldcubeassociation.org/persons/${wcaId}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("profile.wcaOpen")} <ExternalLink aria-hidden="true" />
              </a>
              <Button variant="danger" type="button" disabled={unlinkPending} onClick={() => setConfirmUnlink(true)}>
                <Unlink aria-hidden="true" />
                {unlinkPending ? t("profile.wcaUnlinkPending") : t("profile.wcaUnlink")}
              </Button>
            </div>
          ) : null}
        </div>
        {wcaId ? (
          <>
            {refreshing ? (
              <div className="mt-4">
                <RefreshIndicator label={t("profile.wcaRefreshing")} />
              </div>
            ) : null}
            {loading ? <SkeletonCard lines={4} className="mt-4" label={t("profile.wcaLoading")} /> : null}
            {wcaProfile ? <WcaProfileDetails profile={wcaProfile} entries={entries} /> : null}
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {oauthConfigured === false ? (
              <div role="status" className="flex items-start gap-3 rounded-panel bg-warning-soft p-4">
                <AlertTriangle className="mt-0.5 shrink-0 text-lg text-warning" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="m-0 text-sm font-semibold text-ink">{t("profile.wcaOauthOffTitle")}</p>
                  <p className="m-0 mt-1 text-sm text-ink">{t("profile.wcaOauthOffDetail")}</p>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              {linkButton}
              {oauthConfigured === false ? null : (
                <span className="text-xs text-muted">{t("profile.wcaLinkPrivacy")}</span>
              )}
            </div>
          </div>
        )}
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
