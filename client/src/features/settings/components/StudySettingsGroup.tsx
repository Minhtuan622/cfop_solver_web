import { useLanguage } from "@/contexts/LanguageContext";
import { Field, SectionCard } from "@/components/ui/StudioUI";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/FormControls";
import { Textarea } from "@/components/ui/FormControls";

/** The study preferences: how many cases a cuber wants to practise every day. */
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
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6">
          <Field
            id="setting-daily-goal"
            label={t("settings.dailyGoal")}
            hint={t("settings.dailyGoalHelp")}
          >
            <Input
              id="setting-daily-goal"

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
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
