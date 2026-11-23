/** Nút chỉ có biểu tượng và nút có trạng thái đang xử lý. */
import {
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  /** The accessible name of the button; it doubles as the tooltip. */
  label: string;
  icon: ReactNode;
  title?: string;
};

/**
 * A button that shows nothing but an icon. The label carries the accessible
 * name, so the button never has to repeat its meaning in visible text.
 */
export function IconButton({
  label,
  icon,
  className,
  type = "button",
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cn(
        "inline-grid place-items-center rounded-full transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}

export type PendingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Shows a spinner and blocks further clicks while the action runs. */
  pending?: boolean;
};

/**
 * A button that shows a spinner and stops accepting clicks while its action
 * runs, so every mutation in the app gives the visitor a pending state.
 * The `type` is left untouched: buttons inside a form keep submitting it.
 */
export function PendingButton({
  pending = false,
  disabled,
  className,
  children,
  ...rest
}: PendingButtonProps) {
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2", className)}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? (
        <span
          className="h-4 w-4 animate-spin rounded-full"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
