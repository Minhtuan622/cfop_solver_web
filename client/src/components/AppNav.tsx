import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountNavItem } from "@/features/profile/lib/accountNavItems";
import { BoxSeam } from "@/components/ui/Icon";
import { NavLanguageDropdown } from "@/components/NavLanguageDropdown";
import { NavThemeDropdown } from "@/components/NavThemeDropdown";
import { NavUtilityMenu } from "@/components/NavUtilityMenu";
import { NavOverflowMenu } from "@/components/NavOverflowMenu";
import { cn } from "@/lib/utils";

const primaryNavItems: AccountNavItem[] = [
  { href: "/", labelKey: "nav.solve", active: (path: string) => path === "/" },
  {
    href: "/timer",
    labelKey: "nav.timer",
    active: (path: string) => path === "/timer",
  },
  {
    href: "/history",
    labelKey: "nav.history",
    active: (path: string) => path === "/history",
  },
  {
    href: "/study",
    labelKey: "nav.study",
    active: (path: string) => path === "/study",
  },
  {
    href: "/play",
    labelKey: "nav.play",
    active: (path: string) => path === "/play",
  },
  {
    href: "/rooms",
    labelKey: "nav.rooms",
    active: (path: string) => path === "/rooms" || path.startsWith("/rooms/"),
  },
  {
    href: "/competition",
    labelKey: "nav.rankings",
    active: (path: string) =>
      path === "/competition" || path.startsWith("/competition/"),
  },
  {
    href: "/wca",
    labelKey: "nav.wca",
    active: (path: string) => path === "/wca",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    active: (path: string) => path === "/settings",
  },
];

const overflowNavItems: AccountNavItem[] = [
  {
    href: "/about",
    labelKey: "nav.about",
    active: (path: string) => path === "/about",
  },
  {
    href: "/about-us",
    labelKey: "nav.aboutUs",
    active: (path: string) => path === "/about-us",
  },
  {
    href: "/support",
    labelKey: "nav.support",
    active: (path: string) => path === "/support",
  },
];

const primaryStyles = (active: boolean) =>
  active
    ? "bg-primary text-on-primary"
    : "text-muted hover:bg-surface-2 hover:text-ink";

export function AppNav() {
  const [location] = useLocation();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [path] = location.split("?");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const closeMenus = () => {
    setExpanded(false);
  };

  return (
    <header data-focus-hide className="sticky top-0 z-40 px-3 pt-2 sm:px-5">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-3 rounded-card bg-surface px-3.5 py-2.5 sm:gap-4 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-full px-1 py-1.5"
          aria-label={t("nav.brandLabel")}
          onClick={closeMenus}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-on-primary">
            <BoxSeam className="text-base" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-ink sm:text-base">
              {t("nav.brand")}
            </span>
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <nav
            className="flex flex-wrap items-center justify-center gap-1"
            aria-label={t("nav.main")}
          >
            {primaryNavItems.map(item => {
              const active = item.active(path);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    primaryStyles(active)
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <NavOverflowMenu
              items={overflowNavItems}
              path={path}
              onNavigate={closeMenus}
            />
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          <NavLanguageDropdown />
          <NavThemeDropdown />
          <NavUtilityMenu />
          <button
            className="hidden grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink transition hover:bg-surface-2 lg:hidden"
            type="button"
            aria-label={t("nav.toggle")}
            onClick={() => setExpanded(value => !value)}
          >
            {expanded ? (
              <X className="text-base" />
            ) : (
              <Menu className="text-base" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
