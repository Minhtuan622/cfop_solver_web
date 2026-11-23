import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReviewReminders } from "../lib/useReviewReminders";
import { SettingRow } from "./SettingRow";

/** Hàng cài đặt bật/tắt thông báo nhắc ôn tập (Web Push). */
export function ReviewReminderSetting() {
  const { t } = useLanguage();
  const reminders = useReviewReminders();
  const { status } = reminders;
  const help =
    status === "unsupported"
      ? t("settings.reminders.unsupported")
      : status === "signedOut"
        ? t("settings.reminders.signedOut")
        : status === "unavailable"
          ? t("settings.reminders.unavailable")
          : status === "denied"
            ? t("settings.reminders.denied")
            : t("settings.reminders.help");
  const interactive = status === "on" || status === "off";
  return (
    <SettingRow label={t("settings.reminders")} help={help}>
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Button
          variant={status === "on" ? "outline" : "primary"}
          size="sm"
          disabled={!interactive || reminders.busy}
          onClick={() =>
            void (status === "on" ? reminders.disable() : reminders.enable())
          }
        >
          {status === "on"
            ? t("settings.reminders.turnOff")
            : t("settings.reminders.turnOn")}
        </Button>
        {reminders.error ? (
          <span role="alert" className="text-xs text-danger">
            {t("settings.reminders.error")}
          </span>
        ) : null}
      </div>
    </SettingRow>
  );
}
