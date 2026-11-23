/** Ô số liệu dùng chung cho mọi trang. */
import {
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type StatTileTone = "default" | "warning" | "dark";

/** The single stat tile used by every page, so metrics look the same everywhere. */
export function StatTile({
  label,
  value,
  detail,
  icon,
  tone = "default",
  compact = false,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: StatTileTone;
  compact?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "flex h-full items-start justify-between gap-3 rounded-panel p-4",
        tone === "warning"
          ? "bg-warning-soft"
          : dark
            ? "bg-ink text-surface"
            : "bg-surface-2",
        className
      )}
    >
      {/* Ô giá trị là vùng chứa của container query: cỡ chữ phải theo bề
          rộng của chính chỗ chứa số, không phải bề rộng cả thẻ (thẻ còn
          phần nhãn và icon). `flex-1` để bề rộng vùng chứa là phần không gian
          còn lại, không phụ thuộc nội dung — tránh vòng lặp layout. */}
      <div className="min-w-0 flex-1 @container">
        <small
          className={cn(
            "block text-[11px] font-semibold uppercase tracking-[0.12em]",
            dark ? "text-surface/70" : "text-muted"
          )}
        >
          {label}
        </small>
        <strong
          className={cn(
            // Cỡ chữ theo bề rộng của ô (container query) để thời gian dài
            // không tràn ra ngoài ô.
            //
            // 15cqw không phải ngẫu nhiên: thời gian dài nhất là "83:20.00"
            // (8 ký tự). Đo trên CI (font hệ thống rộng hơn máy dev) mỗi ký tự
            // rộng ~0.62em, nên 8 × 0.62em × 15% ≈ 74% bề rộng ô — còn dư
            // ~25%. Dùng 21cqw thì chữ kín mép ô và tràn ra ngoài.
            "mt-1 block tabular-nums text-[clamp(0.75rem,15cqw,1.5rem)]",
            compact && "text-[clamp(0.7rem,13cqw,1.125rem)]"
          )}
        >
          {value}
        </strong>
        {detail ? (
          <small
            className={cn(
              "mt-1 block text-xs leading-relaxed",
              dark ? "text-surface/70" : "text-muted"
            )}
          >
            {detail}
          </small>
        ) : null}
      </div>
      {icon ? (
        <span
          className={cn(
            "shrink-0 text-xl",
            dark ? "text-surface/70" : "text-muted"
          )}
        >
          {icon}
        </span>
      ) : null}
    </div>
  );
}
