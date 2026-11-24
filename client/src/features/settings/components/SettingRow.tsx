import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingRow({
  label,
  help,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  help?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  const Label = htmlFor ? "label" : "p";
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <Label
          {...(htmlFor ? { htmlFor } : {})}
          className="mb-0 block text-sm font-medium text-ink"
        >
          {label}
        </Label>
        {help ? <p className="mb-0 mt-0.5 text-xs leading-relaxed text-muted">{help}</p> : null}
      </div>
      <div className="shrink-0 sm:max-w-[60%]">{children}</div>
    </div>
  );
}
