/** Bootstrap platform primitives — shared cards, headings and badges for every Rubik route. */
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: "base" | "quiet" | "focus";
};

export function SoftSurface({ children, className, as: Tag = "section" }: SurfaceProps) {
  return <Tag className={cn("card", className)}>{children}</Tag>;
}

export function SoftSectionTitle({ eyebrow, title, detail, className }: { eyebrow?: string; title: string; detail?: string; className?: string }) {
  return <header className={cn("mb-3", className)}>{eyebrow && <p className="small text-muted mb-1">{eyebrow}</p>}<h2 className="">{title}</h2>{detail && <span className="text-muted">{detail}</span>}</header>;
}

export function SoftStatus({ label, value, tone = "neutral", leading }: { label: string; value: ReactNode; tone?: "neutral" | "success" | "warning"; leading?: ReactNode }) {
  const color = tone === "success" ? "text-bg-success" : tone === "warning" ? "text-bg-warning" : "text-bg-secondary";
  return <div className={cn("col-12 col-md-6", "badge text-start", color)}>{leading && <i className="me-1">{leading}</i>}<span>{label}: </span><b>{value}</b></div>;
}
