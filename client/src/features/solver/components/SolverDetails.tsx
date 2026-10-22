import { ChevronRight } from "@/components/ui/BootstrapIcon";
import type { ReactNode } from "react";

/**
 * A quiet collapsible block. The solver page used Bootstrap accordions, which
 * needed the collapse script to be loaded before they could be opened; a
 * native `details` element works on its own and stays keyboard operable.
 */
export function SolverDetails({ summary, children, className }: { summary: ReactNode; children: ReactNode; className?: string }) {
  return (
    <details className={`cfop-solver-details${className ? ` ${className}` : ""}`}>
      <summary>
        <ChevronRight className="cfop-solver-details__chevron" aria-hidden="true" />
        <span>{summary}</span>
      </summary>
      <div className="cfop-solver-details__body">{children}</div>
    </details>
  );
}
