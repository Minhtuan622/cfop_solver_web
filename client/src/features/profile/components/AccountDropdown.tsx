import type { ReactNode } from "react";
import { Link } from "wouter";
import type { AccountNavItem } from "../lib/accountNavItems";

type Props = {
  navItems: AccountNavItem[];
  path: string;
  vi: boolean;
  onNavigate: () => void;
  children: ReactNode;
};

/**
 * The menu shell shared by the signed-in and the signed-out dropdowns: the
 * shared navigation links first, then whatever actions the caller adds.
 */
export function AccountDropdown({
  navItems,
  path,
  vi,
  onNavigate,
  children,
}: Props) {
  return (
    <ul
      id="cfop-account-menu"
      className="dropdown-menu dropdown-menu-end show mt-2"
      role="menu"
    >
      {navItems.map(item => {
        const active = item.active(path);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              role="menuitem"
              className={
                active ? "dropdown-item active py-2" : "dropdown-item py-2"
              }
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              {vi ? item.label : item.labelEn}
            </Link>
          </li>
        );
      })}
      {navItems.length ? (
        <li>
          <hr className="dropdown-divider" />
        </li>
      ) : null}
      {children}
    </ul>
  );
}
