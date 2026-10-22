import { useEffect, useRef, useState } from "react";
import { CircleHalf, MoonStars, SunFill } from "@/components/ui/BootstrapIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; icon: typeof SunFill }[] = [
  { value: "light", icon: SunFill },
  { value: "dark", icon: MoonStars },
  { value: "system", icon: CircleHalf },
];

/** Lets the visitor pick the light palette, the dark palette or the system one. */
export function ThemeSwitcher() {
  const { theme, resolved, setTheme } = useTheme();
  const { language } = useLanguage();
  const vi = language === "vi";
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const labels: Record<Theme, string> = {
    light: vi ? "Sáng" : "Light",
    dark: vi ? "Tối" : "Dark",
    system: vi ? "Hệ thống" : "System",
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const current = OPTIONS.find(option => option.value === theme) ?? OPTIONS[2];
  const CurrentIcon = resolved === "dark" ? MoonStars : resolved === "light" ? SunFill : current.icon;

  return (
    <div ref={menuRef} className="dropdown">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center justify-content-center"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="cfop-theme-menu"
        aria-label={vi ? "Đổi giao diện sáng tối" : "Change the light and dark theme"}
        title={vi ? "Đổi giao diện sáng tối" : "Change the light and dark theme"}
      >
        <CurrentIcon className="fs-6 me-1" />
        <span className="d-none d-xl-inline">{labels[theme]}</span>
      </button>
      {open ? (
        <ul className="dropdown-menu dropdown-menu-end show mt-2" role="menu" id="cfop-theme-menu" aria-label={vi ? "Giao diện" : "Theme"}>
          {OPTIONS.map(option => {
            const OptionIcon = option.icon;
            const active = option.value === theme;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  onClick={() => {
                    setTheme(option.value);
                    setOpen(false);
                  }}
                >
                  <OptionIcon className="fs-6" />
                  {labels[option.value]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
