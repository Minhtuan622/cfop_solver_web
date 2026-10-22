/**
 * A route the shell links to, with its own active matcher. The name is
 * historical: the type was first introduced for the account dropdown, which
 * now only lists account actions.
 */
export type AccountNavItem = {
  href: string;
  /** A `namespace.key` entry of the shared bilingual dictionary. */
  labelKey: string;
  active: (path: string) => boolean;
};
