import { Translate } from "@/components/ui/BootstrapIcon";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

/** The two languages of the interface, each written the way its own speakers write it. */
const OPTIONS: { value: Language; labelKey: string }[] = [
  { value: "vi", labelKey: "language.vietnamese" },
  { value: "en", labelKey: "language.english" },
];

/**
 * Lets the visitor pick the language the interface is written in. The compact
 * form shows the icon only, so a navbar can keep the bar short.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const current = OPTIONS.find(option => option.value === language) ?? OPTIONS[0];

  return (
    <Dropdown
      id="cfop-language-menu"
      label={t("language.change")}
      title={t("language.change")}
      menuLabel={t("language.label")}
      buttonClassName={compact ? "border-0 bg-transparent px-2" : undefined}
      button={
        <>
          <Translate className={compact ? "fs-6" : "fs-6 me-1"} />
          {compact ? null : <span>{t(current.labelKey)}</span>}
        </>
      }
    >
      {OPTIONS.map(option => {
        const active = option.value === language;
        return (
          <li key={option.value}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={active}
              className="dropdown-item py-2 d-flex align-items-center gap-2"
              onClick={() => setLanguage(option.value)}
            >
              <Translate className="fs-6" />
              {t(option.labelKey)}
            </button>
          </li>
        );
      })}
    </Dropdown>
  );
}
