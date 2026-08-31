/** Bootstrap navbar — compact, soft, beginner-friendly navigation for every route. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { CfopAccountControl } from "@/components/CfopAccountControl";

const navItems = [
  { href: "/", label: "Giải Rubik", labelEn: "Solve", active: (path: string) => path === "/" },
  { href: "/timer", label: "Bấm giờ", labelEn: "Timer", active: (path: string) => path === "/timer" },
  { href: "/history", label: "Kết quả", labelEn: "History", active: (path: string) => path === "/history" },
  { href: "/rooms", label: "Thi đấu", labelEn: "Rooms", active: (path: string) => path === "/rooms" || path.startsWith("/rooms/") },
  { href: "/competition", label: "Xếp hạng", labelEn: "Rankings", active: (path: string) => path === "/competition" || path.startsWith("/competition/") },
  { href: "/wca", label: "Giải WCA", labelEn: "WCA", active: (path: string) => path === "/wca" },
  { href: "/study", label: "Học thêm", labelEn: "Study", active: (path: string) => path === "/study" },
  { href: "/settings", label: "Cài đặt", labelEn: "Settings", active: (path: string) => path === "/settings" },
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
  return (
    <header className="navbar navbar-expand-lg cfop-navbar sticky-top">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2" aria-label={vi ? "Giải Rubik — Trang chủ" : "Rubik Solver — Home"} onClick={() => setExpanded(false)}>
          <i className="bi bi-box-seam text-primary" aria-hidden="true" />
          {vi ? "Giải Rubik" : "Rubik Solver"}
        </Link>
        <button className="navbar-toggler border-0 shadow-none" type="button" aria-controls="cfopPrimaryNav" aria-expanded={expanded} aria-label={vi ? "Mở điều hướng" : "Toggle navigation"} data-bootstrap-control="navbar-toggler" onClick={() => setExpanded((value) => !value)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={expanded ? "navbar-collapse show" : "navbar-collapse"} id="cfopPrimaryNav">
          <nav className="navbar-nav ms-auto align-items-lg-center gap-lg-1 py-3 py-lg-0" aria-label={vi ? "Điều hướng chính" : "Main navigation"}>
            {navItems.map((item) => {
              const label = vi ? item.label : item.labelEn;
              const active = item.active(path);
              return (
                <Link key={item.href} href={item.href} onClick={() => setExpanded(false)} className={active ? "nav-link active" : "nav-link"} aria-current={active ? "page" : undefined}>
                  {label}
                </Link>
              );
            })}
            <div className="ms-lg-2 mt-2 mt-lg-0">
              <CfopAccountControl />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
