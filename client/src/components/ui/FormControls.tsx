/**
 * The form controls of the app: text field and textarea.
 *
 * Cả hai dùng chung một kiểu ô nhập (nền nhạt, bo góc ô, vòng focus, trạng
 * thái tắt) nên nhìn luôn giống nhau và một đổi trong file này áp dụng cho
 * cả giao diện.
 *
 * Ô nhập không dùng viền: ranh giới được tạo bằng nền khác nền của khối chứa
 * nó, và vòng focus (viền focus) khi điều hướng bằng bàn phím vẫn giữ nguyên.
 * Ô chọn giá trị nằm ở `Select.tsx`.
 *
 * Nhãn, gợi ý và thông báo lỗi do `Field` của `StudioUI` đảm nhiệm: mọi ô
 * nhập phải có tên nhìn thấy được.
 */
import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Kiểu chung của ô nhập: nền, bo góc, focus và trạng thái tắt. */
const controlBase =
  "w-full rounded-field bg-surface-3 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:bg-surface focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

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

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, "resize-y px-3.5 py-2.5", className)}
      {...rest}
    />
  );
});
