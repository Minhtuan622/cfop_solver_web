/** Xưởng Cơ Khí Tốc Độ — one compact navigation rail for every route. */
import { Cog, FlaskConical, Grid3X3, Timer } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { href: "/", label: "Studio", icon: Grid3X3, active: (path: string, tab: string | null) => path === "/" && !tab },
  { href: "/timer", label: "Timer", icon: Timer, active: (path: string, tab: string | null) => path === "/timer" && tab !== "study" },
  { href: "/timer?tab=study", label: "Study", icon: FlaskConical, active: (path: string, tab: string | null) => path === "/timer" && tab === "study" },
  { href: "/settings", label: "Cài đặt", icon: Cog, active: (path: string) => path === "/settings" },
];

export function AppNav() {
  const [location] = useLocation();
  const { language, setLanguage } = useLanguage();
  const vi = language === "vi";
  const [path, query = ""] = location.split("?");
  const tab = new URLSearchParams(query).get("tab");
  return <header className="app-shell-nav"><div className="app-shell-nav-inner"><Link href="/" className="app-shell-brand" aria-label="CFOP Solver Studio"><img src="/manus-storage/cfop-studio-mark_62473f8e.png" alt="" /><span><b>CF<span className="app-shell-o">O</span>P</b><em>STUDIO</em></span></Link><nav aria-label={vi ? "Điều hướng chính" : "Main navigation"}>{navItems.map((item) => { const Icon = item.icon; const label = item.label === "Cài đặt" && !vi ? "Settings" : item.label; return <Link key={item.href} href={item.href} className={item.active(path, tab) ? "app-shell-link app-shell-link-active" : "app-shell-link"}><Icon /><span>{label}</span></Link>; })}</nav><div className="app-shell-language"><button onClick={() => setLanguage("vi")} className={vi ? "active" : ""}>VI</button><button onClick={() => setLanguage("en")} className={!vi ? "active" : ""}>EN</button></div></div></header>;
}
