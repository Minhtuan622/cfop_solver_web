import { useMemo } from "react";
import {
  Dropdown,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CHECKED_CLASS,
  MENU_ITEM_CLASS,
  MenuCheck,
} from "@/components/ui/Dropdown";
import {
  CircleHalf,
  MoonStars,
  SunFill,
} from "@/components/ui/Icon";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Theme } from "@/lib/theme";

const THEMES: Array<{ value: Theme; icon: typeof SunFill; labelKey: string }> = [
  { value: "light", icon: SunFill, labelKey: "theme.light" },
  { value: "dark", icon: MoonStars, labelKey: "theme.dark" },
  { value: "system", icon: CircleHalf, labelKey: "theme.system" },
];

/** Nút thả xuống chọn giao diện sáng/tối, đặt trên thanh nav (góc phải). */
export function NavThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const current = THEMES.find(option => option.value === theme);
  const CurrentIcon = current?.icon ?? SunFill;

  const themeLabels = useMemo(
    () => ({
      light: t("theme.light"),
      dark: t("theme.dark"),
      system: t("theme.system"),
    }),
    [t]
  );

  return (
    <Dropdown
      id="cfop-nav-theme"
      variant="nav"
      label={t("theme.label")}
      title={`${t("theme.label")} · ${themeLabels[theme]}`}
      menuLabel={t("theme.label")}
      buttonClassName="px-2"
      button={
        <>
          <CurrentIcon className="text-base" />
          <span className="text-[11px] font-semibold">{themeLabels[theme]}</span>
        </>
      }
    >
      <DropdownRadioGroup
        value={theme}
        onValueChange={value => setTheme(value as Theme)}
      >
        {THEMES.map(option => {
          const Icon = option.icon;
          return (
            <DropdownRadioItem
              key={option.value}
              value={option.value}
              className={`${MENU_ITEM_CLASS} ${MENU_ITEM_CHECKED_CLASS}`}
            >
              <Icon className="text-base" />
              {themeLabels[option.value]}
              <MenuCheck />
            </DropdownRadioItem>
          );
        })}
      </DropdownRadioGroup>
    </Dropdown>
  );
}
