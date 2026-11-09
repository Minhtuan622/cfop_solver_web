import { Link } from "wouter";
import { Dropdown } from "@/components/ui/Dropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccountNavItem } from "@/features/profile/lib/accountNavItems";
import { cn } from "@/lib/utils";

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
  const anyActive = items.some(item => item.active(path));

  return (
    <Dropdown
      id="cfop-overflow-menu"
      menuLabel={t("nav.moreLabel")}
      variant="nav"
      className="w-full xl:w-auto"
      buttonClassName={cn(
        "w-full justify-between xl:w-auto xl:justify-center",
        anyActive && "bg-surface-2 text-ink"
      )}
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
              className={cn(
                "flex items-center rounded-xl px-3 py-2 text-sm transition hover:bg-surface-2",
                active
                  ? "bg-primary-soft font-semibold text-primary"
                  : "text-ink"
              )}
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
