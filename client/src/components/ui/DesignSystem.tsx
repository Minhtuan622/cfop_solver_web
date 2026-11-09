/**
 * Shared building blocks of the blue "dashboard" look. Each one wraps a ds-*
 * class from styles/design-system.css, so pages compose them instead of
 * repeating class strings. Colours come from the --ds-* tokens, so they follow
 * light/dark mode on their own.
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ElementType,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./BootstrapUI";

/** A white, rounded, softly shadowed panel. */
export function Surface({
  as: Tag = "section",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <Tag className={cn("ds-card", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** The small tinted square that holds an icon next to a panel title. */
export function IconBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("ds-icon-box", className)} aria-hidden="true">
      {children}
    </span>
  );
}

/** A pill-shaped label above a page title. */
export function EyebrowPill({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("ds-eyebrow", className)}>
      {icon}
      {children}
    </span>
  );
}

/** The title row of a panel: IconBox + heading, with optional actions on the right. */
export function PanelHeader({
  icon,
  title,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "d-flex align-items-center justify-content-between gap-3",
        className
      )}
    >
      <div className="d-flex align-items-center gap-3">
        {icon ? <IconBox>{icon}</IconBox> : null}
        <h2 className="h5 fw-bold mb-0">{title}</h2>
      </div>
      {actions}
    </header>
  );
}

/* ---- Pill tabs ---------------------------------------------------------- */

/** The rounded track that holds pill buttons (and dividers). */
export function PillBar({
  variant = "solid",
  className,
  children,
  ...rest
}: {
  variant?: "solid" | "soft";
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ds-pills",
        variant === "soft" && "ds-pills--soft",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PillDivider() {
  return <span className="ds-divider" aria-hidden="true" />;
}

export type PillOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
};

/** A group of mutually exclusive pill buttons (aria-pressed, like a segmented control). */
export function PillGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  fill = false,
  className,
}: {
  value: T;
  onChange: (next: T) => void;
  options: PillOption<T>[];
  label?: string;
  size?: "sm" | "md";
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("d-inline-flex gap-1", fill && "w-100", className)}
      role="group"
      aria-label={label}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          aria-label={option.ariaLabel}
          className={cn(
            "ds-pill",
            size === "sm" && "ds-pill--sm",
            fill && "flex-fill justify-content-center"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A PillBar with one PillGroup — the common case. */
export function PillTabs<T extends string>({
  variant,
  className,
  ...group
}: Parameters<typeof PillGroup<T>>[0] & { variant?: "solid" | "soft" }) {
  return (
    <PillBar variant={variant} className={cn(group.fill && "w-100", className)}>
      <PillGroup {...group} />
    </PillBar>
  );
}

/* ---- Buttons and inputs -------------------------------------------------- */

/** A round icon button. `primary` is the big blue play-style button. */
export function RoundButton({
  label,
  icon,
  tone = "soft",
  size = "md",
  className,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  label: string;
  icon: ReactNode;
  tone?: "soft" | "primary" | "plain";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <IconButton
      label={label}
      icon={icon}
      className={cn(
        "ds-round",
        tone === "primary" && "ds-round--primary",
        tone === "plain" && "ds-round--plain",
        size === "sm" && "ds-round--sm",
        size === "lg" && "ds-round--lg",
        className
      )}
      {...rest}
    />
  );
}

/** A pill-shaped text field. Pass a visible or visually-hidden <label> yourself. */
export const PillInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function PillInput({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn("form-control ds-input", className)}
      {...rest}
    />
  );
});

/** A small rounded chip button, e.g. one move of a solution. */
export function Chip({
  active,
  className,
  children,
  ...rest
}: { active?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("ds-chip", active && "is-current", className)}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}

/** A full-width status strip with an icon: green for good news, amber for a warning. */
export function Banner({
  tone = "success",
  icon,
  className,
  children,
}: {
  tone?: "success" | "warning";
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "ds-banner",
        tone === "warning" && "ds-banner--warn",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
