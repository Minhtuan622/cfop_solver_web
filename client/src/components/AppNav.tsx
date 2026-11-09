/** Bootstrap navbar — a short bar that keeps every route one click away. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { CfopAccountControl } from "@/features/profile/components/CfopAccountControl";
import type { AccountNavItem } from "@/features/profile/lib/accountNavItems";
import { BoxSeam } from "@/components/ui/BootstrapIcon";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NavOverflowMenu } from "@/components/NavOverflowMenu";

/**
 * Only the four routes a cuber opens every day stay on the bar itself. The
 * rest wait behind one "More" menu, so the bar never turns into a wall of
 * links — and no page is hidden away from the navbar.
 */
const primaryNavItems: AccountNavItem[] = [
  { href: "/", labelKey: "nav.solve", active: (path: string) => path === "/" },
  { href: "/timer", labelKey: "nav.timer", active: (path: string) => path === "/timer" },
  { href: "/history", labelKey: "nav.history", active: (path: string) => path === "/history" },
  { href: "/study", labelKey: "nav.study", active: (path: string) => path === "/study" },
];

const overflowNavItems: AccountNavItem[] = [
  { href: "/rooms", labelKey: "nav.rooms", active: (path: string) => path === "/rooms" || path.startsWith("/rooms/") },
  { href: "/competition", labelKey: "nav.rankings", active: (path: string) => path === "/competition" || path.startsWith("/competition/") },
  { href: "/wca", labelKey: "nav.wca", active: (path: string) => path === "/wca" },
  { href: "/settings", labelKey: "nav.settings", active: (path: string) => path === "/settings" },
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
    <header className="navbar navbar-expand-xl cfop-navbar sticky-top">
      <div className="container-xxl">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2" aria-label={t("nav.brandLabel")} onClick={closeMenus}>
          <BoxSeam className="fs-5 text-primary" />
          {t("nav.brand")}
        </Link>
        <button className="navbar-toggler border-0 shadow-none" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={t("nav.toggle")} data-bootstrap-control="navbar-toggler" onClick={() => setExpanded((value) => !value)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={expanded ? "navbar-collapse show" : "navbar-collapse"} id="cfopPrimaryNav">
          <nav className="navbar-nav ms-auto align-items-lg-center gap-lg-1 py-3 py-lg-0" aria-label={t("nav.main")}>
            {primaryNavItems.map((item) => {
              const active = item.active(path);
              return <Link key={item.href} href={item.href} onClick={closeMenus} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>{t(item.labelKey)}</Link>;
            })}
            <NavOverflowMenu items={overflowNavItems} path={path} onNavigate={closeMenus} />
            <div className="d-flex align-items-center gap-1 ms-lg-2 mt-2 mt-lg-0">
              <LanguageSwitcher compact />
              <ThemeSwitcher compact />
              <CfopAccountControl />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
