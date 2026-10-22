import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DropdownProps = {
  /** The visible content of the toggle. */
  button: ReactNode;
  /**
   * The accessible name of the toggle. Leave it out when the button already
   * carries a visible word, and set it when the button shows nothing but an
   * icon.
   */
  label?: string;
  /** The tooltip of the toggle. */
  title?: string;
  /** The accessible name of the menu itself. */
  menuLabel?: string;
  /** The id of the menu, wired to the toggle through `aria-controls`. */
  id: string;
  /** Which side of the toggle the menu opens on. */
  align?: "start" | "end";
  /** `nav` styles the toggle like the other links of a navbar. */
  variant?: "button" | "nav";
  className?: string;
  buttonClassName?: string;
  children: ReactNode;
};

/**
 * A dropdown that opens on click, closes on Escape or on a click outside and
 * looks the same wherever the app needs a menu.
 */
export function Dropdown({
  button,
  label,
  title,
  menuLabel,
  id,
  align = "end",
  variant = "button",
  className,
  buttonClassName,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggleClass = variant === "nav"
    ? "nav-link dropdown-toggle d-inline-flex align-items-center gap-1"
    : "btn btn-outline-secondary btn-sm dropdown-toggle d-inline-flex align-items-center justify-content-center";

  return (
    <div ref={rootRef} className={cn("dropdown", className)}>
      <button
        type="button"
        className={cn(toggleClass, buttonClassName)}
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        aria-label={label}
        title={title}
      >
        {button}
      </button>
      {open ? (
        <ul
          className={cn("dropdown-menu show mt-2", align === "end" ? "dropdown-menu-end" : "dropdown-menu-start")}
          role="menu"
          id={id}
          aria-label={menuLabel ?? label}
          onClick={event => {
            // Picking an item ends the visit to the menu.
            if ((event.target as HTMLElement).closest("button, a")) setOpen(false);
          }}
        >
          {children}
        </ul>
      ) : null}
    </div>
  );
}
