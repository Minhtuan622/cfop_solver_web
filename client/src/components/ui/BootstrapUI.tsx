import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingTransition({ children, className }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return <div className={cn("loading-content", visible && "loading-content-ready", className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("d-flex flex-column flex-lg-row align-items-lg-start justify-content-lg-between gap-3 mb-4", className)}>
      <div>
        <h1 className="h2 mb-2">{title}</h1>
        {description ? <p className="text-body-secondary mb-0 lead fs-6">{description}</p> : null}
      </div>
      {actions ? <div className="d-flex flex-wrap gap-2 align-items-center">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card", className)}>
      {(title || description || actions) ? (
        <div className="card-header bg-transparent d-flex flex-column flex-sm-row align-items-sm-start justify-content-sm-between gap-2">
          <div>
            {title ? <h2 className="h5 mb-0">{title}</h2> : null}
            {description ? <p className="small text-body-secondary mb-0 mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="d-flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function StatusFeedback({ tone = "info", title, children }: { tone?: "info" | "success" | "warning" | "danger" | "secondary"; title?: string; children: ReactNode }) {
  return (
    <div className={`alert alert-${tone} mb-0`} role={tone === "danger" ? "alert" : "status"}>
      {title ? <p className="fw-semibold mb-1">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

export function SkeletonCard({ lines = 3, className, label = "Đang tải nội dung" }: { lines?: number; className?: string; label?: string }) {
  return (
    <div className={cn("card card-body placeholder-glow text-body-secondary", className)} role="status" aria-label={label}>
      <span className="placeholder col-5 mb-3" />
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={`placeholder d-block mb-2 ${index === lines - 1 ? "col-7" : "col-12"}`} />
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function SkeletonList({ rows = 4, label = "Đang tải danh sách" }: { rows?: number; label?: string }) {
  return (
    <div className="list-group placeholder-glow text-body-secondary" role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div className="list-group-item" key={index}>
          <span className="placeholder col-4 mb-2" />
          <span className="placeholder d-block col-12" />
          <span className="placeholder d-block col-8 mt-2" />
        </div>
      ))}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, label = "Đang tải bảng dữ liệu" }: { rows?: number; columns?: number; label?: string }) {
  return (
    <div className="table-responsive placeholder-glow" role="status" aria-label={label}>
      <table className="table align-middle mb-0">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }, (_, column) => <td key={column}><span className={`placeholder ${column === 0 ? "col-4" : "col-8"}`} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function RefreshIndicator({ label = "Đang cập nhật" }: { label?: string }) {
  return <span className="d-inline-flex align-items-center gap-2 small text-body-secondary" role="status" aria-live="polite"><span className="spinner-border spinner-border-sm" aria-hidden="true" />{label}</span>;
}



