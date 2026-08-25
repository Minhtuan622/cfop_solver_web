/** Xưởng Cơ Khí Tốc Độ — one compact navigation rail for every route. */
/** Bootstrap default navbar: keeps route access while visual customization is deferred. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { CfopAccountControl } from "@/components/CfopAccountControl";

const navItems = [
  { href: "/", label: "Giải Rubik", active: (path: string) => path === "/" },
  { href: "/timer", label: "Bấm giờ", active: (path: string) => path === "/timer" },
  { href: "/history", label: "Kết quả", active: (path: string) => path === "/history" },
  { href: "/rooms", label: "Thi đấu", active: (path: string) => path === "/rooms" || path.startsWith("/rooms/") },
  { href: "/study", label: "Học thêm", active: (path: string) => path === "/study" },
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
  return <header className="navbar navbar-expand-lg bg-body-tertiary border-bottom"><div className="container"><Link href="/" className="navbar-brand" aria-label={vi ? "Giải Rubik" : "Rubik solver"} onClick={() => setExpanded(false)}>{vi ? "Giải Rubik" : "Rubik Solver"}</Link><button className="navbar-toggler" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={vi ? "Mở điều hướng" : "Toggle navigation"} data-bootstrap-control="navbar-toggler" onClick={() => setExpanded((value) => !value)}><span className="navbar-toggler-icon" /></button><div className={expanded ? "navbar-collapse show" : "navbar-collapse"} id="cfopPrimaryNav"><nav className="navbar-nav ms-auto align-items-lg-center" aria-label={vi ? "Điều hướng chính" : "Main navigation"}>{navItems.map((item) => { const label = item.label === "Cài đặt" && !vi ? "Settings" : item.label; const active = item.active(path); return <Link key={item.href} href={item.href} onClick={() => setExpanded(false)} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>{label}</Link>; })}<div className="ms-lg-2 mt-2 mt-lg-0"><CfopAccountControl /></div></nav></div></div></header>;
}
