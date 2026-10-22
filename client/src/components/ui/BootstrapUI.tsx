import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingTransition({ children, className }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return <div className={cn("loading-content", visible && "loading-content-ready", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("small text-uppercase fw-semibold text-body-secondary mb-1", className)}>{children}</p>;
}

export function PageHeader({ title, description, eyebrow, actions, className }: { title: string; description?: string; eyebrow?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("d-flex flex-column flex-lg-row align-items-lg-start justify-content-lg-between gap-3 mb-4", className)}>
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="h2 mb-2">{title}</h1>
        {description ? <p className="text-body-secondary mb-0 lead fs-6">{description}</p> : null}
      </div>
      {actions ? <div className="d-flex flex-wrap gap-2 align-items-center">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card", className)}>
      {(title || description || actions) ? (
        <div className="card-header bg-transparent d-flex flex-column flex-sm-row align-items-sm-start justify-content-sm-between gap-2">
          <div>
            {title ? <h2 className="h5 mb-0">{title}</h2> : null}
            {description ? <p className="small text-body-secondary mb-0 mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function StatusFeedback({ tone = "info", title, action, children }: { tone?: "info" | "success" | "warning" | "danger" | "secondary"; title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className={`alert alert-${tone} mb-0`} role={tone === "danger" ? "alert" : "status"}>
      {title ? <p className="fw-semibold mb-1">{title}</p> : null}
      <div>{children}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Placeholder shown when a list, a table or a panel has nothing to display yet. */
export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("cfop-empty-state", className)}>
      {icon ? <div className="cfop-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <p className="cfop-empty-state__title">{title}</p>
      {description ? <p className="cfop-empty-state__description">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export type StatTileTone = "default" | "warning" | "dark";

/** The single stat tile used by every page, so metrics look the same everywhere. */
export function StatTile({ label, value, detail, icon, tone = "default", compact = false, className }: { label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode; tone?: StatTileTone; compact?: boolean; className?: string }) {
  const dark = tone === "dark";
  const cardClass = tone === "warning" ? "bg-warning-subtle" : dark ? "cfop-inverse-tile border-0 shadow-sm" : "bg-body-tertiary";
  const mutedClass = dark ? "opacity-75" : "text-body-secondary";
  return (
    <div className={cn("card h-100", cardClass, className)}>
      <div className={cn("card-body", compact && "py-2")}>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="flex-grow-1">
            <small className={cn("d-block", mutedClass)}>{label}</small>
            <strong className={cn("d-block mt-1", compact ? "fs-6" : "fs-5")}>{value}</strong>
            {detail ? <small className={cn("d-block mt-1", mutedClass)}>{detail}</small> : null}
          </div>
          {icon ? <span className={mutedClass}>{icon}</span> : null}
        </div>
      </div>
    </div>
  );
}

/** Label + control + optional hint or error, so every control has a visible name. */
export function Field({ id, label, hint, error, required, className, children }: { id: string; label: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cn("form-label", required && "cfop-field__required")}>
        {label}
      </label>
      {children}
      {error ? <p className="text-danger small mt-1 mb-0" role="alert">{error}</p> : null}
      {!error && hint ? <p className="form-text mt-1 mb-0">{hint}</p> : null}
    </div>
  );
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** The accessible name of the button; it doubles as the tooltip. */
  label: string;
  icon: ReactNode;
  title?: string;
};

/**
 * A button that shows nothing but an icon. The label carries the accessible
 * name, so the button never has to repeat its meaning in visible text.
 */
export function IconButton({ label, icon, className, type = "button", title, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cn("cfop-icon-button d-inline-flex align-items-center justify-content-center", className)}
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
      className={className}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...rest}
    >
      {pending ? (
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

export function SkeletonCard({ lines = 3, className, label = "Đang tải nội dung" }: { lines?: number; className?: string; label?: string }) {
  return (
    <div className={cn("card card-body placeholder-glow text-body-secondary", className)} role="status" aria-label={label}>
      <span className="placeholder col-5 mb-3" />
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={`placeholder d-block mb-2 ${index === lines - 1 ? "col-7" : "col-12"}`} />
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function SkeletonList({ rows = 4, label = "Đang tải danh sách" }: { rows?: number; label?: string }) {
  return (
    <div className="list-group placeholder-glow text-body-secondary" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div className="list-group-item" key={index}>
          <span className="placeholder col-4 mb-2" />
          <span className="placeholder d-block col-12" />
          <span className="placeholder d-block col-8 mt-2" />
        </div>
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, label = "Đang tải bảng dữ liệu" }: { rows?: number; columns?: number; label?: string }) {
  return (
    <div className="table-responsive placeholder-glow" role="status" aria-label={label}>
      <table className="table align-middle mb-0">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => <td key={column}><span className={`placeholder ${column === 0 ? "col-4" : "col-8"}`} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function RefreshIndicator({ label = "Đang cập nhật" }: { label?: string }) {
  return <span className="d-inline-flex align-items-center gap-2 small text-body-secondary" role="status" aria-live="polite"><span className="spinner-border spinner-border-sm" aria-hidden="true" />{label}</span>;
}



