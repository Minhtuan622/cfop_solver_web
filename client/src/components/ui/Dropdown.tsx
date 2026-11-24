import { type ReactNode } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type DropdownProps = {
  button: ReactNode;
  label?: string;
  title?: string;
  menuLabel?: string;
  id: string;
  align?: "start" | "end";
  variant?: "button" | "nav" | "soft";
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  children: ReactNode;
};

export const DropdownItem = DropdownMenuPrimitive.Item;

export const MENU_ITEM_CLASS =
  "flex w-full cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors data-[highlighted]:bg-menu-hover data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";
export const MENU_ITEM_CHECKED_CLASS = "data-[state=checked]:font-semibold";
export const MENU_LABEL_CLASS =
  "px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted";

export function MenuCheck() {
  return (
    <DropdownMenuPrimitive.ItemIndicator className="ml-auto shrink-0 text-primary">
      <Check aria-hidden="true" />
    </DropdownMenuPrimitive.ItemIndicator>
  );
}
export const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;
export const DropdownRadioItem = DropdownMenuPrimitive.RadioItem;

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
