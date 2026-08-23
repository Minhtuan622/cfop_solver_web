/**
 * Soft Minimal UI primitives — shared surface, title and status building blocks.
 * Use these for application chrome; Rubik cube renderers keep their own functional geometry.
 */
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: "base" | "quiet" | "focus";
};

export function SoftSurface({ children, className, as: Tag = "section", tone = "base" }: SurfaceProps) {
  return <Tag className={cn("soft-surface", `soft-surface-${tone}`, className)}>{children}</Tag>;
}

export function SoftSectionTitle({ eyebrow, title, detail, className }: { eyebrow?: string; title: string; detail?: string; className?: string }) {
  return <header className={cn("soft-section-title", className)}>{eyebrow && <p>{eyebrow}</p>}<h2>{title}</h2>{detail && <span>{detail}</span>}</header>;
}

export function SoftStatus({ label, value, tone = "neutral", leading }: { label: string; value: ReactNode; tone?: "neutral" | "success" | "warning"; leading?: ReactNode }) {
  return <div className={cn("soft-status", `soft-status-${tone}`)}>{leading && <i>{leading}</i>}<span>{label}</span><b>{value}</b></div>;
}
