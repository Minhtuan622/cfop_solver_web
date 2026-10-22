/** The groups the settings page is split into, in the order they are shown. */
export type SettingsGroupId = "solver" | "timer" | "study" | "appearance";

export type SettingsGroup = {
  id: SettingsGroupId;
  /** The `namespace.key` entry of the group name. */
  labelKey: string;
  /** The `namespace.key` entry of the one-line explanation under the name. */
  descriptionKey: string;
};

export const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  { id: "solver", labelKey: "settings.group.solver", descriptionKey: "settings.group.solverHelp" },
  { id: "timer", labelKey: "settings.group.timer", descriptionKey: "settings.group.timerHelp" },
  { id: "study", labelKey: "settings.group.study", descriptionKey: "settings.group.studyHelp" },
  { id: "appearance", labelKey: "settings.group.appearance", descriptionKey: "settings.group.appearanceHelp" },
];

/** The group the page opens on. */
export const DEFAULT_SETTINGS_GROUP: SettingsGroupId = "solver";
