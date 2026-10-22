/** A route the account dropdown can link to, with its own active matcher. */
export type AccountNavItem = {
  href: string;
  label: string;
  labelEn: string;
  active: (path: string) => boolean;
};
