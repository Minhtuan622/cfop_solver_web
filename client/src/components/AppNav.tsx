/** Xưởng Cơ Khí Tốc Độ — one compact navigation rail for every route. */
import { Cog, FlaskConical, Grid3X3, Timer } from "lucide-react";
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
  const vi = language === "vi";
  const [path] = location.split("?");
  return <header className="app-shell-nav"><div className="app-shell-nav-inner"><Link href="/" className="app-shell-brand" aria-label="CFOP Solver Studio"><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="" /><span><b>CF<span className="app-shell-o">O</span>P</b><em>SOLVER STUDIO</em></span></Link><nav aria-label={vi ? "Điều hướng chính" : "Main navigation"}>{navItems.map((item) => { const Icon = item.icon; const label = item.label === "Cài đặt" && !vi ? "Settings" : item.label; return <Link key={item.href} href={item.href} className={item.active(path) ? "app-shell-link app-shell-link-active" : "app-shell-link"}><Icon /><span>{label}</span></Link>; })}</nav></div></header>;
}
