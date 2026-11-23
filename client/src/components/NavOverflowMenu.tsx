import { Link } from "wouter";
import { Dropdown, DropdownItem, MENU_ITEM_CLASS } from "@/components/ui/Dropdown";
import { Check } from "@/components/ui/Icon";
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
        anyActive &&
          "bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary data-[state=open]:bg-primary-hover"
      )}
      button={<span>{t("nav.more")}</span>}
    >
      {items.map(item => {
        const active = item.active(path);
        return (
          <DropdownItem asChild key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(MENU_ITEM_CLASS, active && "font-semibold")}
              onClick={onNavigate}
            >
              {t(item.labelKey)}
              {active ? (
                <Check className="ml-auto shrink-0 text-primary" aria-hidden="true" />
              ) : null}
            </Link>
          </DropdownItem>
        );
      })}
    </Dropdown>
  );
}
