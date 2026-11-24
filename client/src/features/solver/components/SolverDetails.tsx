import { ChevronRight } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SolverDetails({
  summary,
  children,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn(
        "group rounded-panel bg-surface-2/60 open:bg-surface-2",
        className
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:text-primary [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="shrink-0 text-base text-muted transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        <span>{summary}</span>
      </summary>
      <div className="px-3.5 pb-3.5 pt-2">{children}</div>
    </details>
  );
}
