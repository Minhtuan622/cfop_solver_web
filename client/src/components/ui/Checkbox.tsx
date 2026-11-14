import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Hộp kiểm tuỳ chỉnh, giữ nguyên `<input type="checkbox">` bên trong để bảo toàn
 * khả năng tiếp cận và các bài kiểm tra (role/aria-label). Chỉ thay phần hiển thị.
 */
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
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={event => onChange(event.target.checked)}
        />
        <span
          className="absolute inset-0 rounded-lg bg-surface-3 transition peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20"
          aria-hidden="true"
        />
        <svg
          className="relative h-4 w-4 text-white opacity-0 transition peer-checked:opacity-100"
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
      </span>
      {label ? <span className="text-sm text-ink">{label}</span> : null}
    </label>
  );
}
