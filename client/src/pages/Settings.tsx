/** The settings shell: a short list of groups, one group open at a time. */
import { useState } from "react";
import { Check, RotateCcw } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
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
  const [activeGroup, setActiveGroup] = useState<SettingsGroupId>(
    DEFAULT_SETTINGS_GROUP
  );
  const state = useSettingsState();

  const saveLabel =
    state.saveState === "saving"
      ? t("settings.saving")
      : state.saveState === "saved"
        ? t("settings.saved")
        : t("settings.autoSave");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.subtitle")}
        actions={
          <span
            className="text-sm text-muted inline-flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            {state.saveState === "saved" ? (
              <Check className="text-base" />
            ) : null}
            {saveLabel}
          </span>
        }
      />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SettingsGroupTabs
            groups={SETTINGS_GROUPS}
            activeId={activeGroup}
            onSelect={setActiveGroup}
            label={t("settings.groups")}
          />
          <Button
            variant="link"
            size="sm"
            className="border-0 bg-transparent p-0 text-primary hover:underline px-3 py-1.5 text-xs text-muted px-0 mt-4"
            type="button"
            onClick={state.reset}
          >
            <RotateCcw className="text-base mr-1" />
            {t("settings.restoreDefaults")}
          </Button>
        </div>
        <div className="col-span-12 lg:col-span-9">
          {SETTINGS_GROUPS.map(group => (
            <div
              key={group.id}
              role="tabpanel"
              id={`settings-panel-${group.id}`}
              aria-labelledby={`settings-tab-${group.id}`}
              hidden={group.id !== activeGroup}
            >
              {group.id === "solver" ? (
                <SolverSettingsGroup
                  solver={state.solver}
                  onChange={state.updateSolver}
                  onToggleExcluded={state.toggleExcluded}
                />
              ) : null}
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
              {group.id === "study" ? (
                <StudySettingsGroup
                  dailyGoal={state.dailyGoal}
                  onDailyGoalChange={state.setDailyGoal}
                />
              ) : null}
              {group.id === "appearance" ? <AppearanceSettingsGroup /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
