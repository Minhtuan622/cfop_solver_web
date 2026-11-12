import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function LoadingTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted",
        className
      )}
    >
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-line/80 bg-surface shadow-soft",
        className
      )}
    >
      {title || description || actions ? (
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

const feedbackTones = {
  info: "border-info/20 bg-info-soft text-ink",
  success: "border-success/20 bg-success-soft text-ink",
  warning: "border-warning/25 bg-warning-soft text-ink",
  danger: "border-danger/20 bg-danger-soft text-ink",
  secondary: "border-line bg-surface-2 text-ink",
} as const;

export function StatusFeedback({
  tone = "info",
  title,
  action,
  children,
}: {
  tone?: keyof typeof feedbackTones;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-panel border px-4 py-3 text-sm",
        feedbackTones[tone]
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div>{children}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Placeholder shown when a list, a table or a panel has nothing to display yet. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface-2/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-2xl text-primary"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export type StatTileTone = "default" | "warning" | "dark";

/** The single stat tile used by every page, so metrics look the same everywhere. */
export function StatTile({
  label,
  value,
  detail,
  icon,
  tone = "default",
  compact = false,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: StatTileTone;
  compact?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex h-full items-start justify-between gap-3 rounded-panel border p-4 @container",
        tone === "warning"
          ? "border-warning/20 bg-warning-soft"
          : dark
            ? "border-transparent bg-ink text-surface shadow-soft"
            : "border-line/80 bg-surface-2",
        className
      )}
    >
      <div className="min-w-0">
        <small
          className={cn(
            "block text-[11px] font-semibold uppercase tracking-[0.12em]",
            dark ? "text-surface/70" : "text-muted"
          )}
        >
          {label}
        </small>
        <strong
          className={cn(
            // Cỡ chữ theo bề rộng của ô (container query) để thời gian dài
            // không tràn ra ngoài ô.
            "mt-1 block tabular-nums text-[clamp(0.8rem,21cqw,1.5rem)]",
            compact && "text-[clamp(0.75rem,19cqw,1.125rem)]"
          )}
        >
          {value}
        </strong>
        {detail ? (
          <small
            className={cn(
              "mt-1 block text-xs leading-relaxed",
              dark ? "text-surface/70" : "text-muted"
            )}
          >
            {detail}
          </small>
        ) : null}
      </div>
      {icon ? (
        <span
          className={cn(
            "shrink-0 text-xl",
            dark ? "text-surface/70" : "text-muted/80"
          )}
        >
          {icon}
        </span>
      ) : null}
    </div>
  );
}

/** Label + control + optional hint or error, so every control has a visible name. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** A switch that turns one preference on or off, with its explanation beside it. */
export function Switch({
  id,
  checked,
  onChange,
  label,
  help,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  help?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <label
        className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center"
        htmlFor={id}
      >
        <input
          id={id}
          className="peer sr-only"
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={event => onChange(event.target.checked)}
        />
        <span
          className="absolute inset-0 rounded-full bg-surface-3 transition peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20 peer-disabled:opacity-50"
          aria-hidden="true"
        />
        <span
          className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </label>
      <label
        htmlFor={id}
        className={cn(
          "min-w-0 text-sm leading-relaxed",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        <span className="font-medium text-ink">{label}</span>
        {help ? (
          <span className="mt-0.5 block text-xs text-muted">{help}</span>
        ) : null}
      </label>
    </div>
  );
}

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
        "inline-grid place-items-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
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
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}

export function SkeletonCard({
  lines = 3,
  className,
  label = "Đang tải nội dung",
}: {
  lines?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-card border border-line/70 bg-surface p-5 shadow-soft sm:p-6",
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="mb-4 block h-4 w-1/2 rounded-full bg-surface-3" />
      {Array.from({ length: lines }, (_, index) => (
        <span
          key={index}
          className={cn(
            "mb-2.5 block h-3 rounded-full bg-surface-3",
            index === lines - 1 ? "w-7/12" : "w-full"
          )}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonList({
  rows = 4,
  label = "Đang tải danh sách",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="animate-pulse divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface"
      role="status"
      aria-label={label}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div className="space-y-2 p-4" key={index}>
          <span className="block h-3 w-1/3 rounded-full bg-surface-3" />
          <span className="block h-3 w-full rounded-full bg-surface-3" />
          <span className="block h-3 w-2/3 rounded-full bg-surface-3" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  label = "Đang tải bảng dữ liệu",
}: {
  rows?: number;
  columns?: number;
  label?: string;
}) {
  return (
    <div
      className="animate-pulse overflow-x-auto"
      role="status"
      aria-label={label}
    >
      <table className="w-full text-left text-sm">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="border-b border-line last:border-0">
              {Array.from({ length: columns }, (_, column) => (
                <td key={column} className="px-3 py-3">
                  <span
                    className={cn(
                      "block h-3 rounded-full bg-surface-3",
                      column === 0 ? "w-1/3" : "w-2/3"
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function RefreshIndicator({
  label = "Đang cập nhật",
}: {
  label?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-muted"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
