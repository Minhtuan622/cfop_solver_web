import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "soft"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerSolid"
  | "success"
  | "warning"
  | "inverse"
  | "link";

export type ButtonSize =
  | "plain"
  | "xs"
  | "sm"
  | "md"
  | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-surface text-ink hover:bg-surface-2",
  soft: "bg-surface-2 text-ink hover:bg-surface-3",
  outline: "bg-transparent text-primary hover:bg-primary-soft",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
  danger: "bg-transparent text-danger hover:bg-danger-soft",
  dangerSolid: "bg-danger text-on-danger hover:brightness-95",
  success: "bg-transparent text-success hover:bg-success-soft",
  warning: "bg-warning text-on-warning hover:brightness-95",
  inverse: "bg-ink text-surface hover:opacity-90",
  link: "bg-transparent text-primary hover:underline",
};

const buttonSizes: Record<ButtonSize, string> = {
  plain: "",
  xs: "px-3 py-1.5 text-xs whitespace-nowrap leading-none",
  sm: "px-4 py-2 text-xs whitespace-nowrap leading-none",
  md: "px-4 py-2 text-sm whitespace-nowrap leading-none",
  lg: "px-5 py-3 text-base whitespace-nowrap leading-none",
};

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md"): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    icon,
    iconRight,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClass(variant, size), className)}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
});
