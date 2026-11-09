import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "@/components/ui/Icon";
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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20",
          variant === "nav"
            ? "rounded-full px-3.5 py-2 text-muted hover:bg-surface-2 hover:text-ink"
            : "rounded-full border border-line bg-surface px-3.5 py-2 text-ink shadow-sm hover:bg-surface-2",
          buttonClassName
        )}
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        aria-label={label}
        title={title}
      >
        {button}
        <ChevronDown
          className={cn(
            "text-sm transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <ul
          className={cn(
            "absolute z-50 mt-2 min-w-52 list-none rounded-2xl border border-line/80 bg-surface p-1.5 shadow-float",
            align === "end" ? "right-0" : "left-0"
          )}
          role="menu"
          id={id}
          aria-label={menuLabel ?? label}
          onClick={event => {
            // Picking an item ends the visit to the menu.
            if ((event.target as HTMLElement).closest("button, a"))
              setOpen(false);
          }}
        >
          {children}
        </ul>
      ) : null}
    </div>
  );
}
