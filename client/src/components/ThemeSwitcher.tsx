import { CircleHalf, MoonStars, SunFill } from "@/components/ui/Icon";
import { Dropdown } from "@/components/ui/Dropdown";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: typeof SunFill }[] = [
  { value: "light", icon: SunFill },
  { value: "dark", icon: MoonStars },
  { value: "system", icon: CircleHalf },
];

/**
 * Lets the visitor pick the light palette, the dark palette or the system one.
 * The compact form shows the icon only, so a navbar can keep the bar short.
 */
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
      {OPTIONS.map(option => {
        const OptionIcon = option.icon;
        const active = option.value === theme;
        return (
          <li key={option.value}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={active}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-2 aria-checked:bg-primary-soft aria-checked:font-semibold aria-checked:text-primary"
              onClick={() => setTheme(option.value)}
            >
              <OptionIcon className="text-base" />
              {labels[option.value]}
            </button>
          </li>
        );
      })}
    </Dropdown>
  );
}
