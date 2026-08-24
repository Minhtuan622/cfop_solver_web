/** Xưởng Cơ Khí Tốc Độ — one compact navigation rail for every route. */
/** Bootstrap default navbar: keeps route access while visual customization is deferred. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { href: "/", label: "Studio", active: (path: string) => path === "/" },
  { href: "/timer", label: "Timer", active: (path: string) => path === "/timer" },
  { href: "/history", label: "History", active: (path: string) => path === "/history" },
  { href: "/study", label: "Study", active: (path: string) => path === "/study" },
  { href: "/settings", label: "Cài đặt", active: (path: string) => path === "/settings" },
];

export function AppNav() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const vi = language === "vi";
  const [path] = location.split("?");
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  return <header className="navbar navbar-expand-lg bg-body-tertiary border-bottom"><div className="container"><Link href="/" className="navbar-brand" aria-label="CFOP Solver Studio" onClick={() => setExpanded(false)}>CFOP Solver Studio</Link><button className="navbar-toggler" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={vi ? "Mở điều hướng" : "Toggle navigation"} data-bootstrap-control="navbar-toggler" onClick={() => setExpanded((value) => !value)}><span className="navbar-toggler-icon" /></button><div className={expanded ? "navbar-collapse show" : "navbar-collapse"} id="cfopPrimaryNav"><nav className="navbar-nav ms-auto" aria-label={vi ? "Điều hướng chính" : "Main navigation"}>{navItems.map((item) => { const label = item.label === "Cài đặt" && !vi ? "Settings" : item.label; const active = item.active(path); return <Link key={item.href} href={item.href} onClick={() => setExpanded(false)} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>{label}</Link>; })}</nav></div></div></header>;
}
