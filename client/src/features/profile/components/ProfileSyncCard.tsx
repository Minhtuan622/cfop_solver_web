import { CheckCircleFill } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

/** Thẻ đồng bộ cloud: trạng thái, lần lưu gần nhất và nút đồng bộ ngay. */
export function ProfileSyncCard({
  connected,
  updatedAt,
  pending,
  onSync,
}: {
  connected: boolean;
  updatedAt: string | number | Date | null | undefined;
  pending: boolean;
  onSync: () => void;
}) {
  const { language, t } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-US";
  return (
    <div className="rounded-card bg-surface">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="bg-success-soft text-success rounded-xl p-2">
            <CheckCircleFill className="text-lg" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight mb-1">
              {t("profile.syncTitle")}
            </h2>
            <p className="text-sm text-muted mb-2">
              {t("profile.syncHint")}
            </p>
          </div>
        </div>
        <p className="text-sm mb-4 mt-4">
          <span
            className={
              connected ? "text-success" : "text-muted"
            }
          >
            {connected
                            ? t("profile.syncConnected")
              : t("profile.syncChecking")}
          </span>
          {updatedAt
                        ? ` · ${new Date(updatedAt).toLocaleString(locale)}`
            : ` · ${t("profile.syncNeverSaved")}`}
        </p>
        <Button
          variant="primary"
          size="md"
          className="w-full"
          type="button"
          onClick={onSync}
          disabled={pending}
          >
          {pending
            ? t("profile.syncPending")
            : t("profile.syncNow")}
        </Button>
      </div>
    </div>
  );
}
