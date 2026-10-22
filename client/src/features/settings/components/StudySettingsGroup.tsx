import { useLanguage } from "@/contexts/LanguageContext";
import { Field, SectionCard } from "@/components/ui/BootstrapUI";

/** The study preferences: how many cases a cuber wants to practise every day. */
export function StudySettingsGroup({ dailyGoal, onDailyGoalChange }: { dailyGoal: number; onDailyGoalChange: (next: number) => void }) {
  const { t } = useLanguage();

  return (
    <SectionCard title={t("settings.group.study")} description={t("settings.group.studyHelp")}>
      <div className="row g-3">
        <div className="col-12 col-sm-6">
          <Field id="setting-daily-goal" label={t("settings.dailyGoal")} hint={t("settings.dailyGoalHelp")}>
            <input
              id="setting-daily-goal"
              className="form-control"
              type="number"
              min={1}
              max={200}
              value={dailyGoal}
              onChange={event => onDailyGoalChange(Math.max(1, Math.min(200, Number(event.target.value) || 1)))}
            />
          </Field>
        </div>
      </div>
    </SectionCard>
  );
}
