import {
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  label: string;
  icon: ReactNode;
  title?: string;
};

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
  pending?: boolean;
};

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
