import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountNavItem } from "@/features/profile/lib/accountNavItems";
import { BoxSeam, X } from "@/components/ui/Icon";
import { NavUtilityMenu } from "@/components/NavUtilityMenu";
import { NavOverflowMenu } from "@/components/NavOverflowMenu";
import { cn } from "@/lib/utils";

const mainNavItems: AccountNavItem[] = [
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

const infoNavItems: AccountNavItem[] = [
  {
    href: "/records",
    labelKey: "nav.records",
    active: (path: string) => path === "/records",
  },
  {
    href: "/about",
    labelKey: "nav.about",
    active: (path: string) => path === "/about",
  },
  {
    href: "/donate",
    labelKey: "nav.donate",
    active: (path: string) => path === "/donate",
  },
  {
    href: "/guide",
    labelKey: "nav.guide",
    active: (path: string) => path === "/guide",
  },
];

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
    <header data-focus-hide className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[88rem] flex-wrap items-center gap-2 rounded-card bg-surface px-3 py-2 sm:px-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label={t("nav.brandLabel")}
          onClick={closeMenus}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-on-primary">
            <BoxSeam className="text-xl" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-ink sm:text-base">
              {t("nav.brand")}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-primary sm:block">
              Studio
            </span>
          </span>
        </Link>

        <button
          className="ml-auto grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-2 xl:hidden"
          type="button"
          aria-controls="cfopPrimaryNav"
          aria-expanded={expanded}
          aria-label={t("nav.toggle")}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? (
            <X className="text-lg" />
          ) : (
            <Menu className="text-lg" strokeWidth={2.2} />
          )}
        </button>

        <div
          id="cfopPrimaryNav"
          className={cn(
            "order-last basis-full flex-col gap-2 xl:order-none xl:flex xl:flex-1 xl:basis-auto xl:flex-row xl:items-center xl:justify-end xl:gap-1",
            expanded ? "mt-4 flex xl:mt-0" : "hidden xl:flex"
          )}
        >
          <nav
            className="flex flex-col gap-1 xl:flex-row xl:items-center"
            aria-label={t("nav.main")}
          >
            {mainNavItems.map(item => {
              const active = item.active(path);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={cn(
                    "flex items-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition xl:px-3 xl:py-2",
                    active
                      ? "bg-primary text-on-primary"
                      : "text-muted hover:bg-surface-2 hover:text-ink"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <NavOverflowMenu
              id="cfop-info-menu"
              labelKey="nav.info"
              menuLabelKey="nav.infoLabel"
              items={infoNavItems}
              path={path}
              onNavigate={closeMenus}
            />
          </nav>
          <div className="mt-4 flex items-center gap-1 xl:mt-0 xl:ml-2">
            <NavUtilityMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
