import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ColorCustomizer } from "./ColorCustomizer";
import { SettingRow } from "./SettingRow";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard } from "@/components/ui/StudioUI";

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
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-0 text-sm font-medium text-ink">{t("settings.colors")}</p>
            <p className="mb-0 mt-0.5 text-xs leading-relaxed text-muted">{t("settings.colorsHelp")}</p>
          </div>
          <ColorCustomizer />
        </div>
      </div>
    </SectionCard>
  );
}
