import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-field bg-surface-2 text-sm text-ink transition-colors placeholder:text-placeholder hover:bg-surface-3 focus:bg-surface-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
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
