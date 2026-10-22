/** A route the account dropdown can link to, with its own active matcher. */
export type AccountNavItem = {
  href: string;
  /** A `namespace.key` entry of the shared bilingual dictionary. */
  labelKey: string;
  active: (path: string) => boolean;
};
