import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const cardClass =
  "rounded-card bg-surface";

export type CardProps = {
  as?: ElementType;
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

export function CardBody({ className, children, ...rest }: { className?: string; children: ReactNode } & Record<string, unknown>) {
  return (
    <div className={cn("p-5 sm:p-6", className)} {...rest}>
      {children}
    </div>
  );
}
