import { describe, expect, it } from "vitest";
import * as settings from "./index";

describe("settings feature public boundary", () => {
  it("exports the groups and the panels through the feature barrel", () => {
    expect(settings.SETTINGS_GROUPS.map(group => group.id)).toEqual(["solver", "timer", "study", "appearance"]);
    expect(settings.DEFAULT_SETTINGS_GROUP).toBe("solver");
    expect(typeof settings.SettingsGroupTabs).toBe("function");
    expect(typeof settings.SolverSettingsGroup).toBe("function");
    expect(typeof settings.TimerSettingsGroup).toBe("function");
    expect(typeof settings.StudySettingsGroup).toBe("function");
    expect(typeof settings.AppearanceSettingsGroup).toBe("function");
    expect(typeof settings.useSettingsState).toBe("function");
  });
});
