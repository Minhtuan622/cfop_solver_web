import { ReviewReminderSetting } from "./ReviewReminderSetting";
import { SettingRow } from "./SettingRow";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard } from "@/components/ui/StudioUI";
import { Input } from "@/components/ui/FormControls";

export function StudySettingsGroup({
  dailyGoal,
  onDailyGoalChange,
}: {
  dailyGoal: number;
  onDailyGoalChange: (next: number) => void;
}) {
  const { t } = useLanguage();

  return (
    <SectionCard
      title={t("settings.group.study")}
      description={t("settings.group.studyHelp")}
    >
      <SettingRow
        label={t("settings.dailyGoal")}
        help={t("settings.dailyGoalHelp")}
        htmlFor="setting-daily-goal"
      >
        <Input
          id="setting-daily-goal"
          className="w-28"
          type="number"
          min={1}
          max={200}
          value={dailyGoal}
          onChange={event =>
            onDailyGoalChange(
              Math.max(1, Math.min(200, Number(event.target.value) || 1))
            )
          }
        />
      </SettingRow>
      <ReviewReminderSetting />
    </SectionCard>
  );
}
