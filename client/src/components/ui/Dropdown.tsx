import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import {
  computeFloatingGeometry,
  floatingStyle,
  sameFloatingStyle,
} from "@/components/ui/floating";

/** Bề rộng tối thiểu của menu (tương đương `min-w-52`). */
const MENU_MIN_WIDTH = 208;

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
 *
 * Menu gắn vào `document.body` qua portal và định vị tuyệt đối theo toạ độ
 * tài liệu của nút (xem `floating.ts`), nên không bị cắt bởi
 * `overflow-hidden` của card chứa nó, và lật lên khi sát đáy khung nhìn.
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
  const [floating, setFloating] = useState<{
    placement: "bottom" | "top";
    style: CSSProperties;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  /** Đo chỗ trống quanh nút để quyết định hướng mở và chiều cao menu. */
  const measure = useCallback(() => {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;
    const geometry = computeFloatingGeometry({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollX,
      scrollY,
      triggerTop: rect.top,
      triggerBottom: rect.bottom,
      triggerLeft: rect.left,
      triggerWidth: rect.width,
      minWidth: MENU_MIN_WIDTH,
    });
    const next = {
      placement: geometry.placement,
      style: floatingStyle(geometry, {
        align,
        rightDoc: rect.right + scrollX,
        viewportWidth: window.innerWidth,
      }),
    };
    setFloating(prev =>
      prev &&
      prev.placement === next.placement &&
      sameFloatingStyle(prev.style, next.style)
        ? prev
        : next,
    );
  }, [align]);

  const openMenu = useCallback(() => {
    measure();
    setOpen(true);
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const node = event.target as Node;
      if (rootRef.current?.contains(node)) return;
      // Menu nổi qua portal nằm ngoài root, phải giữ riêng nếu không lần
      // pointerdown đầu trên menu sẽ đóng luôn.
      if (menuRef.current?.contains(node)) return;
      setOpen(false);
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

  // Trong lúc menu mở, đo lại khi cuộn hoặc đổi cỡ khung nhìn để menu bám
  // theo nút. `capture: true` bắt cả scroll của các vùng cuộn bên trong trang.
  useEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, measure]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20",
          variant === "nav"
            ? "rounded-full px-3.5 py-2 text-muted hover:bg-surface-2 hover:text-ink"
            : "rounded-full bg-surface px-3.5 py-2 text-ink hover:bg-surface-2",
          buttonClassName
        )}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
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
      {open && floating
        ? createPortal(
            <div className="absolute inset-x-0 top-0 h-0">
              <ul
                ref={menuRef}
                className={cn(
                  "absolute z-50 min-w-52 list-none rounded-2xl bg-surface p-1.5",
                )}
                style={floating.style}
                data-placement={floating.placement}
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
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
