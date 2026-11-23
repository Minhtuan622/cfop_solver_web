import { type ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "@/components/ui/Icon";
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
  variant?: "button" | "nav" | "soft";
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  children: ReactNode;
};

/**
 * Menu components dùng chung cho các Dropdown của app, re-export nguyên Radix.
 * Mỗi mục menu phải là `DropdownItem` (hoặc `DropdownRadioItem`) để dùng được
 * điều hướng bàn phím và lựa chọn bằng phím Enter/Space.
 */
export const DropdownItem = DropdownMenuPrimitive.Item;

/**
 * Một kiểu mục menu cho MỌI dropdown của app (cùng kiểu với mục của Select):
 * không nền riêng, rê chuột tô `menu-hover`; mục đang chọn chữ đậm kèm dấu ✓
 * màu nhấn (`MenuCheck`). Không tự viết chuỗi class mục menu ở nơi khác.
 */
export const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors data-[highlighted]:bg-menu-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";
/** Mục đang chọn của DropdownRadioItem. */
export const MENU_ITEM_CHECKED_CLASS = "data-[state=checked]:font-semibold";
/** Nhãn nhóm trong menu (TÀI KHOẢN, NGÔN NGỮ…). */
export const MENU_LABEL_CLASS =
  "px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted";

/** Dấu ✓ ở cuối mục đang chọn của DropdownRadioItem. */
export function MenuCheck() {
  return (
    <DropdownMenuPrimitive.ItemIndicator className="ml-auto shrink-0 text-primary">
      <Check aria-hidden="true" />
    </DropdownMenuPrimitive.ItemIndicator>
  );
}
export const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;
export const DropdownRadioItem = DropdownMenuPrimitive.RadioItem;

/**
 * A dropdown that opens on click (or Enter/Space), closes on Escape, on a
 * click outside or after a menu item is picked. Built on Radix DropdownMenu:
 * portal, collision flipping, arrow-key navigation and focus management all
 * come from the library.
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
  menuClassName,
  children,
}: DropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <DropdownMenuPrimitive.Root modal={false}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            className={cn(
              "group inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors",
              variant === "nav"
                ? "rounded-full px-3.5 py-2 text-muted hover:bg-surface-2 hover:text-ink data-[state=open]:bg-surface-2 data-[state=open]:text-ink"
                : variant === "soft"
                  ? "rounded-full bg-surface-2 px-3.5 py-2 text-ink hover:bg-surface-3 data-[state=open]:bg-surface-3"
                  : "rounded-full bg-surface px-3.5 py-2 text-ink hover:bg-surface-2 data-[state=open]:bg-surface-2",
              buttonClassName
            )}
            aria-label={label}
            title={title}
          >
            {button}
            <ChevronDown
              className="text-sm transition-transform duration-200 group-aria-expanded:rotate-180"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            id={id}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            aria-label={menuLabel ?? label}
            className={cn(
              // Không có bóng đổ: menu nổi dùng nền đậm hơn một bậc để tách
              // khỏi nội dung bên dưới.
              "z-50 min-w-52 overflow-y-auto rounded-2xl bg-menu p-1.5",
              menuClassName
            )}
          >
            {children}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}
