/** Bootstrap navbar — compact, soft, beginner-friendly navigation for every route. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { CfopAccountControl, type AccountNavItem } from "@/features/profile";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

/**
 * Every route of the app lives in the navbar. The account dropdown only holds
 * account actions, so no page is hidden behind an avatar menu.
 */
const navItems: AccountNavItem[] = [
  { href: "/", labelKey: "nav.solve", active: (path: string) => path === "/" },
  { href: "/timer", labelKey: "nav.timer", active: (path: string) => path === "/timer" },
  { href: "/history", labelKey: "nav.history", active: (path: string) => path === "/history" },
  { href: "/study", labelKey: "nav.study", active: (path: string) => path === "/study" },
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
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2" aria-label={t("nav.brandLabel")} onClick={closeMenus}>
          <i className="bi bi-box-seam text-primary" aria-hidden="true" />
          {t("nav.brand")}
        </Link>
        <button className="navbar-toggler border-0 shadow-none" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={t("nav.toggle")} data-bootstrap-control="navbar-toggler" onClick={() => setExpanded((value) => !value)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={expanded ? "navbar-collapse show" : "navbar-collapse"} id="cfopPrimaryNav">
          <nav className="navbar-nav ms-auto align-items-lg-center gap-lg-1 py-3 py-lg-0" aria-label={t("nav.main")}>
            {navItems.map((item) => {
              const active = item.active(path);
              return <Link key={item.href} href={item.href} onClick={closeMenus} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>{t(item.labelKey)}</Link>;
            })}
            <div className="d-flex align-items-center gap-2 ms-lg-2 mt-2 mt-lg-0">
              <ThemeSwitcher />
              <CfopAccountControl />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
