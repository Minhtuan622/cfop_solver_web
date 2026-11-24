import {
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  labelClassName,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-sm font-medium text-ink",
          labelClassName,
        )}
      >
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
    <div className="flex items-center justify-between gap-4">
      <label
        className="relative order-2 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center"
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
          className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5"
          aria-hidden="true"
        />
      </label>
      <label
        htmlFor={id}
        className={cn(
          "order-1 min-w-0 flex-1 text-sm leading-relaxed",
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
