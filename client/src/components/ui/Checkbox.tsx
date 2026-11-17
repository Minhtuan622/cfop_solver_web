import { useId, type ReactNode } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onCheckedChange={value => onChange(value === true)}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface-3 transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:bg-primary"
      >
        <CheckboxPrimitive.Indicator asChild>
          <svg
            className="h-4 w-4 text-on-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? (
        <label htmlFor={id} className="text-sm text-ink">
          {label}
        </label>
      ) : null}
    </span>
  );
}
