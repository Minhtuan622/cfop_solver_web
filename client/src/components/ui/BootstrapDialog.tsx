import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dialogClassName?: string;
};

function ModalShell({
  open,
  onOpenChange,
  children,
  dialogClassName,
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        onMouseDown={event => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-sm-down ${dialogClassName ?? ""}`}
        >
          <div className="modal-content">
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        data-testid="dialog-backdrop"
        aria-hidden="true"
        onMouseDown={() => onOpenChange(false)}
      />
    </>,
    document.body
  );
}

export function Dialog({
  open,
  onOpenChange,
  children,
  dialogClassName,
}: ModalShellProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      dialogClassName={dialogClassName}
    >
      {children}
    </ModalShell>
  );
}
export function DialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`d-flex flex-column ${className ?? ""}`}>{children}</div>
  );
}
export function DialogHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`modal-header ${className ?? ""}`}>{children}</div>;
}
export function DialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={`modal-title fs-5 ${className ?? ""}`}>{children}</h2>;
}
export function DialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-body-secondary mb-0 ${className ?? ""}`}>{children}</p>
  );
}
export function DialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`modal-footer ${className ?? ""}`}>{children}</div>;
}
