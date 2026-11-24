export type AccountNavItem = {
  href: string;
  labelKey: string;
  active: (path: string) => boolean;
};
