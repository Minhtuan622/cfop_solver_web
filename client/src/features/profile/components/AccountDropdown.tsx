import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/**
 * The menu shell shared by the signed-in and the signed-out dropdowns. It only
 * holds account actions — the app routes live in the navbar.
 */
export function AccountDropdown({ children }: Props) {
  return (
    <ul
      id="cfop-account-menu"
      className="absolute right-0 z-50 mt-2 min-w-56 list-none rounded-2xl bg-surface p-1.5"
      role="menu"
    >
      {children}
    </ul>
  );
}
