import {
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type StatTileTone = "default" | "warning" | "dark";

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
        "flex h-full items-start justify-between gap-3 rounded-panel p-4",
        tone === "warning"
          ? "bg-warning-soft"
          : dark
            ? "bg-ink text-surface"
            : "bg-surface-2",
        className
      )}
    >
      <div className="min-w-0 flex-1 @container">
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
            "mt-1 block tabular-nums text-[clamp(0.75rem,15cqw,1.5rem)]",
            compact && "text-[clamp(0.7rem,13cqw,1.125rem)]"
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
            dark ? "text-surface/70" : "text-muted"
          )}
        >
          {icon}
        </span>
      ) : null}
    </div>
  );
}
