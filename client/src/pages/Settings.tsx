/** The settings shell: a short list of groups, one group open at a time. */
import { useState } from "react";
import { Check, RotateCcw } from "@/components/ui/BootstrapIcon";
import { PageHeader } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AppearanceSettingsGroup,
  DEFAULT_SETTINGS_GROUP,
  SETTINGS_GROUPS,
  SettingsGroupTabs,
  SolverSettingsGroup,
  StudySettingsGroup,
  TimerSettingsGroup,
  useSettingsState,
  type SettingsGroupId,
} from "@/features/settings";

export default function Settings() {
  const { t } = useLanguage();
  const [activeGroup, setActiveGroup] = useState<SettingsGroupId>(DEFAULT_SETTINGS_GROUP);
  const state = useSettingsState();

  const saveLabel = state.saveState === "saving" ? t("settings.saving") : state.saveState === "saved" ? t("settings.saved") : t("settings.autoSave");

  return (
    <div className="container py-3">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
        actions={
          <span className="small text-body-secondary d-inline-flex align-items-center gap-1" role="status" aria-live="polite">
            {state.saveState === "saved" ? <Check className="fs-6" /> : null}
            {saveLabel}
          </span>
        }
      />
      <div className="row g-4">
        <div className="col-12 col-lg-3">
          <SettingsGroupTabs groups={SETTINGS_GROUPS} activeId={activeGroup} onSelect={setActiveGroup} label={t("settings.groups")} />
          <button type="button" onClick={state.reset} className="btn btn-link btn-sm text-body-secondary px-0 mt-3">
            <RotateCcw className="fs-6 me-1" />
            {t("settings.restoreDefaults")}
          </button>
        </div>
        <div className="col-12 col-lg-9">
          {SETTINGS_GROUPS.map(group => (
            <div key={group.id} role="tabpanel" id={`settings-panel-${group.id}`} aria-labelledby={`settings-tab-${group.id}`} hidden={group.id !== activeGroup}>
              {group.id === "solver" ? <SolverSettingsGroup solver={state.solver} onChange={state.updateSolver} onToggleExcluded={state.toggleExcluded} /> : null}
              {group.id === "timer" ? (
                <TimerSettingsGroup
                  sound={state.sound}
                  splits={state.splits}
                  highlight={state.highlight}
                  onSoundChange={state.setSound}
                  onSplitsChange={state.setSplits}
                  onHighlightChange={state.setHighlight}
                />
              ) : null}
              {group.id === "study" ? <StudySettingsGroup dailyGoal={state.dailyGoal} onDailyGoalChange={state.setDailyGoal} /> : null}
              {group.id === "appearance" ? <AppearanceSettingsGroup /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
