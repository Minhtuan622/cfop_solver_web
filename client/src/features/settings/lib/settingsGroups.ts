export type SettingsGroupId = "solver" | "timer" | "study" | "appearance";

export type SettingsGroup = {
  id: SettingsGroupId;
  labelKey: string;
  descriptionKey: string;
};

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  { id: "solver", labelKey: "settings.group.solver", descriptionKey: "settings.group.solverHelp" },
  { id: "timer", labelKey: "settings.group.timer", descriptionKey: "settings.group.timerHelp" },
  { id: "study", labelKey: "settings.group.study", descriptionKey: "settings.group.studyHelp" },
  { id: "appearance", labelKey: "settings.group.appearance", descriptionKey: "settings.group.appearanceHelp" },
];

export const DEFAULT_SETTINGS_GROUP: SettingsGroupId = "solver";
