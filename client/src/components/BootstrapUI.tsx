import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: ReactNode; className?: string }) {
  return <header className={cn("d-flex align-items-lg-start justify-content-lg-between gap-3 mb-4", className)}>
    <div>
      <h1 className="mb-1">{title}</h1>
      {description ? <p className="text-body-secondary mb-0">{description}</p> : null}
    </div>
    {actions ? <div className="d-flex flex-wrap gap-2 align-items-center">{actions}</div> : null}
  </header>;
}

export function SectionCard({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("card", className)}>
    {(title || description || actions) ? <div className="card-header bg-body d-flex align-items-sm-start justify-content-sm-between gap-2">
      <div>{title ? <h2 className="mb-0">{title}</h2> : null}{description ? <p className="small text-body-secondary mb-0 mt-1">{description}</p> : null}</div>
      {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
    </div> : null}
    <div className="card-body">{children}</div>
  </section>;
}

export function StatusFeedback({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "danger" | "secondary"; title?: string; children: ReactNode }) {
  return <div className={`alert alert-${tone} mb-0`} role={tone === "danger" ? "alert" : "status"}>
    {title ? <p className="fw-semibold mb-1">{title}</p> : null}
    <div>{children}</div>
  </div>;
}

export function FieldGroup({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return <div>
    <label className="form-label" htmlFor={id}>{label}</label>
    {children}
    {error ? <div id={`${id}-error`} className="d-block">{error}</div> : null}
    {!error && hint ? <div id={`${id}-hint`} className="form-text">{hint}</div> : null}
  </div>;
}
