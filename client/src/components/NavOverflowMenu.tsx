import { Link } from "wouter";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountNavItem } from "@/features/profile";

/**
 * The routes that do not fit on the bar itself wait behind this one menu, so
 * the navbar stays short without hiding a page away.
 */
export function NavOverflowMenu({
  items,
  path,
  onNavigate,
}: {
  items: readonly AccountNavItem[];
  path: string;
  onNavigate?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Dropdown
      id="cfop-overflow-menu"
      menuLabel={t("nav.moreLabel")}
      variant="nav"
      className="d-grid d-xl-block"
      button={<span>{t("nav.more")}</span>}
    >
      {items.map(item => {
        const active = item.active(path);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              role="menuitem"
              aria-current={active ? "page" : undefined}
              className={active ? "dropdown-item py-2 active" : "dropdown-item py-2"}
              onClick={onNavigate}
            >
              {t(item.labelKey)}
            </Link>
          </li>
        );
      })}
    </Dropdown>
  );
}
