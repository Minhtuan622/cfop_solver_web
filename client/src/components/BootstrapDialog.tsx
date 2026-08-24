import { createContext, useContext, useEffect, type ReactNode } from "react";

const DialogContext = createContext<{ close: () => void }>({ close: () => undefined });
function ModalShell({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  useEffect(() => { if (!open) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [onOpenChange, open]);
  if (!open) return null;
  return <DialogContext.Provider value={{ close: () => onOpenChange(false) }}><div className="modal d-block" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}><div className="modal-dialog modal-dialog-scrollable"><div className="modal-content">{children}</div></div></div><div className="modal-backdrop" /></DialogContext.Provider>;
}

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) { return <ModalShell open={open} onOpenChange={onOpenChange}>{children}</ModalShell>; }
export function DialogContent({ children, className }: { children: ReactNode; className?: string }) { return <div className={className}>{children}</div>; }
export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) { return <div className={`modal-header ${className ?? ""}`}>{children}</div>; }
export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) { return <h2 className={`modal-title fs-5 ${className ?? ""}`}>{children}</h2>; }
export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) { return <p className={`text-body-secondary mb-0 ${className ?? ""}`}>{children}</p>; }
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) { return <div className={`modal-footer ${className ?? ""}`}>{children}</div>; }
export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) { return <ModalShell open={open} onOpenChange={onOpenChange}>{children}</ModalShell>; }
export function SheetContent({ children, className }: { children: ReactNode; side?: "right" | "left"; className?: string }) { return <div className={className}>{children}</div>; }
export function SheetHeader({ children, className }: { children: ReactNode; className?: string }) { return <div className={`modal-header ${className ?? ""}`}>{children}</div>; }
export function SheetTitle({ children, className }: { children: ReactNode; className?: string }) { return <h2 className={`modal-title fs-5 ${className ?? ""}`}>{children}</h2>; }
export function SheetDescription({ children, className }: { children: ReactNode; className?: string }) { return <p className={`text-body-secondary mb-0 ${className ?? ""}`}>{children}</p>; }
export function DialogCloseButton() { const { close } = useContext(DialogContext); return <button type="button" className="btn-close" aria-label="Đóng" onClick={close} />; }
