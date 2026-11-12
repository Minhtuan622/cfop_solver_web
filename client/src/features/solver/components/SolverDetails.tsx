import { ChevronRight } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * A quiet collapsible block. The solver page used styled panels, which
 * needed the collapse script to be loaded before they could be opened; a
 * native `details` element works on its own and stays keyboard operable.
 */
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
      <div className="px-3.5 pb-3.5">{children}</div>
    </details>
  );
}
