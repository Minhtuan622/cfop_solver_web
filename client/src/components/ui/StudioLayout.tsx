/** Bố cục trang: chuyển cảnh khi tải, nhãn nhỏ, tiêu đề trang và thẻ mục. */
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function LoadingTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted",
        className
      )}
    >
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-card bg-surface",
        className
      )}
    >
      {title || description || actions ? (
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
