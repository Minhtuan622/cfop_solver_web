/**
 * Shared building blocks of the dashboard look. Each one composes Tailwind
 * utilities, so pages assemble surfaces instead of repeating class strings.
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ElementType,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./StudioUI";

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
    <Tag
      className={cn(
        "rounded-card bg-surface",
        className
      )}
      {...rest}
    >
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
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-lg text-primary",
        className
      )}
      aria-hidden="true"
    >
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
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary",
        className
      )}
    >
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
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon ? <IconBox>{icon}</IconBox> : null}
        <h2 className="truncate text-base font-semibold tracking-tight text-ink sm:text-lg">
          {title}
        </h2>
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
        "inline-flex flex-wrap items-center gap-1 rounded-full p-1",
        variant === "solid"
          ? "bg-surface"
          : "bg-surface-2",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PillDivider() {
  return (
    <span className="mx-1 h-6 w-px self-center bg-line" aria-hidden="true" />
  );
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
      className={cn(
        "inline-flex flex-wrap items-center gap-1",
        fill && "w-full",
        className
      )}
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
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium text-muted transition outline-none hover:bg-surface-2 hover:text-ink focus-visible:ring-4 focus-visible:ring-primary/20 aria-pressed:bg-primary aria-pressed:text-white aria-pressed:hover:bg-primary",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
            fill && "flex-1"
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
    <PillBar
      variant={variant}
      className={cn(group.fill && "w-full", className)}
    >
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
        "text-ink disabled:pointer-events-none",
        tone === "soft" && "bg-surface-2 hover:bg-surface-3",
        tone === "primary" &&
          "bg-primary text-white hover:bg-primary-hover",
        tone === "plain" &&
          "bg-transparent text-muted hover:bg-surface-2 hover:text-ink",
        size === "sm" && "h-9 w-9 text-base",
        size === "md" && "h-11 w-11 text-lg",
        size === "lg" && "h-14 w-14 text-2xl",
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
      className={cn(
        "h-11 w-full rounded-full bg-surface-2 px-5 font-mono text-sm text-ink outline-none transition placeholder:text-muted/60 focus:bg-surface focus:ring-4 focus:ring-primary/15",
        className
      )}
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
      className={cn(
        "inline-flex min-w-9 items-center justify-center rounded-lg bg-surface-2 px-2.5 py-1.5 font-mono text-sm font-semibold text-ink transition hover:bg-surface-3 aria-pressed:bg-primary aria-pressed:text-white",
        className
      )}
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
        "flex items-start gap-3 rounded-panel px-4 py-3 text-sm text-ink [&>svg]:mt-0.5 [&>svg]:shrink-0",
        tone === "success"
          ? "bg-success-soft [&>svg]:text-success"
          : "bg-warning-soft [&>svg]:text-warning",
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
