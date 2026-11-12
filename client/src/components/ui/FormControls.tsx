/**
 * The form controls of the app: text field, select and textarea.
 *
 * Cả ba dùng chung một kiểu ô nhập (viền, bo góc, vòng focus, trạng thái tắt)
 * nên nhìn luôn giống nhau và một đổi trong file này áp dụng cho cả giao diện.
 *
 * Nhãn, gợi ý và thông báo lỗi do `Field` của `StudioUI` đảm nhiệm: mọi ô
 * nhập phải có tên nhìn thấy được.
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Kiểu chung của ô nhập: viền, bo góc, nền, focus và trạng thái tắt. */
const controlBase =
  "w-full rounded-field border border-line bg-surface text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Icon nằm trong ô, bên trái nội dung. */
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, ...rest },
  ref,
) {
  if (!icon) {
    return (
      <input
        ref={ref}
        className={cn(controlBase, "px-3.5 py-2.5", className)}
        {...rest}
      />
    );
  }
  return (
    <span className="relative block">
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted"
        aria-hidden="true"
      >
        {icon}
      </span>
      <input
        ref={ref}
        className={cn(controlBase, "py-2.5 pl-10 pr-3.5", className)}
        {...rest}
      />
    </span>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(controlBase, "cursor-pointer px-3.5 py-2.5 pr-9", className)}
      {...rest}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "resize-y px-3.5 py-2.5 leading-relaxed", className)}
      {...rest}
    />
  );
});
