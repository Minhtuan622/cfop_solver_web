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
      className="dropdown-menu dropdown-menu-end show mt-2"
      role="menu"
    >
      {children}
    </ul>
  );
}
