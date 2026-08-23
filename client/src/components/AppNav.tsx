/** Xưởng Cơ Khí Tốc Độ — one compact navigation rail for every route. */
/** Bootstrap platform shell: responsive navbar with the familiar navigation contract across every route. */
import { Cog, FlaskConical, Grid3X3, Menu, Timer, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { href: "/", label: "Studio", icon: Grid3X3, active: (path: string) => path === "/" },
  { href: "/timer", label: "Timer", icon: Timer, active: (path: string) => path === "/timer" },
  { href: "/study", label: "Study", icon: FlaskConical, active: (path: string) => path === "/study" },
  { href: "/settings", label: "Cài đặt", icon: Cog, active: (path: string) => path === "/settings" },
];

export function AppNav() {
  const [location] = useLocation();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const vi = language === "vi";
  const [path] = location.split("?");
  return <header className="app-shell-nav navbar navbar-expand-lg sticky-top"><div className="container-xxl px-3 px-lg-4"><Link href="/" className="app-shell-brand navbar-brand d-inline-flex align-items-center gap-2 me-3" aria-label="CFOP Solver Studio" onClick={() => setExpanded(false)}><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="" /><span><b>CF<span className="app-shell-o">O</span>P</b><em>SOLVER STUDIO</em></span></Link><button className="navbar-toggler border-0 shadow-none ms-auto" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={vi ? "Mở điều hướng" : "Toggle navigation"} onClick={() => setExpanded((value) => !value)}>{expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button><div className={expanded ? "bs-navbar-collapse navbar-collapse show" : "bs-navbar-collapse navbar-collapse"} id="cfopPrimaryNav"><nav className="navbar-nav ms-lg-auto align-items-lg-center gap-lg-1" aria-label={vi ? "Điều hướng chính" : "Main navigation"}>{navItems.map((item) => { const Icon = item.icon; const label = item.label === "Cài đặt" && !vi ? "Settings" : item.label; return <Link key={item.href} href={item.href} onClick={() => setExpanded(false)} className={item.active(path) ? "nav-link app-shell-link active" : "nav-link app-shell-link"}><Icon /><span>{label}</span></Link>; })}</nav></div></div></header>;
}
