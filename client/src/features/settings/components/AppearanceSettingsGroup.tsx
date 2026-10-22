import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectionCard } from "@/components/ui/BootstrapUI";

/** The look of the app: the language it is written in and the palette it uses. */
export function AppearanceSettingsGroup() {
  const { t } = useLanguage();

  return (
    <SectionCard title={t("settings.group.appearance")} description={t("settings.group.appearanceHelp")}>
      <div className="vstack gap-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="flex-grow-1">
            <p className="form-label mb-0">{t("settings.language")}</p>
            <p className="small text-body-secondary mb-0">{t("settings.languageHelp")}</p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="flex-grow-1">
            <p className="form-label mb-0">{t("settings.theme")}</p>
            <p className="small text-body-secondary mb-0">{t("settings.themeHelp")}</p>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </SectionCard>
  );
}
