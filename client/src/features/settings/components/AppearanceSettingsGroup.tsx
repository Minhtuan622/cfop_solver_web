import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grow">
            <p className="mb-1.5 block text-sm font-medium text-ink mb-0">
              {t("settings.language")}
            </p>
            <p className="text-sm text-muted mb-0">
              {t("settings.languageHelp")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grow">
            <p className="mb-1.5 block text-sm font-medium text-ink mb-0">
              {t("settings.theme")}
            </p>
            <p className="text-sm text-muted mb-0">{t("settings.themeHelp")}</p>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </SectionCard>
  );
}
