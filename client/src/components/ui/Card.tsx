/**
 * The panel of the app.
 *
 * Mọi khối trên mọi trang đều là một `Card`: cùng bo góc, cùng viền, cùng bóng.
 * Trước đây chuỗi class này bị viết tay ở 86 chỗ nên các panel lệch nhau
 * rất nhẹ (viền đậm/nhạt, bóng mờ/đậm).
 *
 *   <Card><CardBody>…</CardBody></Card>
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chuỗi class chuẩn của panel — nguồn duy nhất. */
export const cardClass =
  "rounded-card border border-line/80 bg-surface shadow-soft";

export type CardProps = {
  /** Thẻ HTML dùng để bọc, mặc định `section`. */
  as?: ElementType;
  /** Khoảng đệm bên trong panel. */
  padded?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
};

export function Card({ as: Tag = "section", padded = false, className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn(cardClass, padded && "p-5 sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Phần thân của panel, dùng khi không muốn khoảng đệm ở chính `Card`. */
export function CardBody({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={cn("p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}
