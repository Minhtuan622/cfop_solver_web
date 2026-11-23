import { Translate } from "@/components/ui/Icon";
import {
  Dropdown,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CHECKED_CLASS,
  MENU_ITEM_CLASS,
  MenuCheck,
} from "@/components/ui/Dropdown";
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
          ? "bg-transparent px-2.5 hover:bg-surface-2"
          : undefined
      }
      button={
        <>
          <Translate className={cn("text-base", !compact && "mr-1")} />
          {compact ? null : <span>{t(current.labelKey)}</span>}
        </>
      }
    >
      <DropdownRadioGroup
        value={language}
        onValueChange={value => setLanguage(value as Language)}
      >
        {OPTIONS.map(option => (
          <DropdownRadioItem
            key={option.value}
            value={option.value}
            className={`${MENU_ITEM_CLASS} ${MENU_ITEM_CHECKED_CLASS}`}
          >
            <Translate className="text-base" />
            {t(option.labelKey)}
            <MenuCheck />
          </DropdownRadioItem>
        ))}
      </DropdownRadioGroup>
    </Dropdown>
  );
}
