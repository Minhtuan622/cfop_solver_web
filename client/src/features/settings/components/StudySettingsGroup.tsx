import { useLanguage } from "@/contexts/LanguageContext";
import { Field, SectionCard } from "@/components/ui/StudioUI";

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
            <input
              id="setting-daily-goal"
              className="w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
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
