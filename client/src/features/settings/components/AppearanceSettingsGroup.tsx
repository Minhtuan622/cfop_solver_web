import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SettingRow } from "./SettingRow";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard } from "@/components/ui/StudioUI";

/** The look of the app: the language it is written in and the palette it uses. */
export function AppearanceSettingsGroup() {
  const { t } = useLanguage();

  return (
    <SectionCard
      title={t("settings.group.appearance")}
      description={t("settings.group.appearanceHelp")}
    >
      <div className="flex flex-col gap-6">
        <SettingRow label={t("settings.language")} help={t("settings.languageHelp")}>
          <LanguageSwitcher />
        </SettingRow>
        <SettingRow label={t("settings.theme")} help={t("settings.themeHelp")}>
          <ThemeSwitcher />
        </SettingRow>
      </div>
    </SectionCard>
  );
}
