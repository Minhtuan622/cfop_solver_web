import { CircleHalf, MoonStars, SunFill } from "@/components/ui/Icon";
import {
  Dropdown,
  DropdownRadioGroup,
  DropdownRadioItem,
  MENU_ITEM_CHECKED_CLASS,
  MENU_ITEM_CLASS,
  MenuCheck,
} from "@/components/ui/Dropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: typeof SunFill }[] = [
  { value: "light", icon: SunFill },
  { value: "dark", icon: MoonStars },
  { value: "system", icon: CircleHalf },
];

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, resolved, setTheme } = useTheme();
  const { t } = useLanguage();

  const labels: Record<Theme, string> = {
    light: t("theme.light"),
    dark: t("theme.dark"),
    system: t("theme.system"),
  };

  const current = OPTIONS.find(option => option.value === theme) ?? OPTIONS[2];
  const CurrentIcon =
    resolved === "dark"
      ? MoonStars
      : resolved === "light"
        ? SunFill
        : current.icon;

  return (
    <Dropdown
      id="cfop-theme-menu"
      label={t("theme.change")}
      title={t("theme.change")}
      menuLabel={t("theme.label")}
      buttonClassName={
        compact
          ? "bg-transparent px-2.5 hover:bg-surface-2"
          : undefined
      }
      button={
        <>
          <CurrentIcon className={cn("text-base", !compact && "mr-1")} />
          {compact ? null : <span>{labels[theme]}</span>}
        </>
      }
    >
      <DropdownRadioGroup
        value={theme}
        onValueChange={value => setTheme(value as Theme)}
      >
        {OPTIONS.map(option => {
          const OptionIcon = option.icon;
          return (
            <DropdownRadioItem
              key={option.value}
              value={option.value}
              className={`${MENU_ITEM_CLASS} ${MENU_ITEM_CHECKED_CLASS}`}
            >
              <OptionIcon className="text-base" />
              {labels[option.value]}
              <MenuCheck />
            </DropdownRadioItem>
          );
        })}
      </DropdownRadioGroup>
    </Dropdown>
  );
}
