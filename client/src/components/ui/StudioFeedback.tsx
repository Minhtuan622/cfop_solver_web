import {
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const feedbackTones = {
  info: "bg-info-soft text-ink",
  success: "bg-success-soft text-ink",
  warning: "bg-warning-soft text-ink",
  danger: "bg-danger-soft text-ink",
  secondary: "bg-surface-2 text-ink",
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
        "flex flex-col gap-1 rounded-panel px-4 py-3 text-sm",
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
        "flex flex-col items-center justify-center gap-3 rounded-card bg-surface-2/50 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-2xl text-muted"
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
        className="h-3.5 w-3.5 animate-spin rounded-full"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
