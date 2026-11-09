import { Translate } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  const current =
    OPTIONS.find(option => option.value === language) ?? OPTIONS[0];

  return (
    <Dropdown
      id="cfop-language-menu"
      label={t("language.change")}
      title={t("language.change")}
      menuLabel={t("language.label")}
      buttonClassName={
        compact
          ? "border-0 bg-transparent px-2.5 shadow-none hover:bg-surface-2"
          : undefined
      }
      button={
        <>
          <Translate className={cn("text-base", !compact && "mr-1")} />
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
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-2 aria-checked:bg-primary-soft aria-checked:font-semibold aria-checked:text-primary"
              onClick={() => setLanguage(option.value)}
            >
              <Translate className="text-base" />
              {t(option.labelKey)}
            </button>
          </li>
        );
      })}
    </Dropdown>
  );
}
