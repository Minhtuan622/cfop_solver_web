import { useMemo } from "react";
import {
  Dropdown,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CHECKED_CLASS,
  MENU_ITEM_CLASS,
  MenuCheck,
} from "@/components/ui/Dropdown";
import { Translate } from "@/components/ui/Icon";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n";

const LANGUAGES: Array<{ value: Language; label: string }> = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

/** Nút thả xuống chọn ngôn ngữ, đặt trên thanh nav (góc phải). */
export function NavLanguageDropdown() {
  const { language, setLanguage, t } = useLanguage();
  const label = LANGUAGES.find(option => option.value === language)?.label ?? "Vi";

  const menuLabels = useMemo(
    () => LANGUAGES.map(option => ({ value: option.value, label: option.label })),
    []
  );

  return (
    <Dropdown
      id="cfop-nav-language"
      variant="nav"
      label={t("language.label")}
      title={`${t("language.label")} · ${label}`}
      menuLabel={t("language.label")}
      buttonClassName="px-2"
      button={
        <>
          <Translate className="text-base" />
          <span className="text-[11px] font-semibold">{label}</span>
        </>
      }
    >
      <DropdownRadioGroup
        value={language}
        onValueChange={value => setLanguage(value as typeof language)}
      >
        {menuLabels.map(option => (
          <DropdownRadioItem
            key={option.value}
            value={option.value}
            className={`${MENU_ITEM_CLASS} ${MENU_ITEM_CHECKED_CLASS}`}
          >
            {option.label}
            <MenuCheck />
          </DropdownRadioItem>
        ))}
      </DropdownRadioGroup>
    </Dropdown>
  );
}
