import { useEffect, useState } from "react";

interface ManusDialogProps { title?: string; logo?: string; open?: boolean; onLogin: () => void; onOpenChange?: (open: boolean) => void; onClose?: () => void; }

export function ManusDialog({ title, logo, open = false, onLogin, onOpenChange, onClose }: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);
  useEffect(() => { if (!onOpenChange) setInternalOpen(open); }, [open, onOpenChange]);
  const visible = onOpenChange ? open : internalOpen;
  const close = () => { onOpenChange?.(false); if (!onOpenChange) setInternalOpen(false); onClose?.(); };
  if (!visible) return null;
  return <><div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="manus-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><div className="modal-dialog"><div className="modal-content text-center"><div className="modal-header"><h2 className="modal-title fs-5" id="manus-dialog-title">{title ?? "Login required"}</h2><button type="button" className="btn-close" aria-label="Đóng" onClick={close} /></div><div className="modal-body">{logo ? <img src={logo} alt="Dialog graphic" className="img-fluid mb-3" style={{ maxHeight: "4rem" }} /> : null}<p className="mb-0 text-body-secondary">Please login with Manus to continue</p></div><div className="modal-footer"><button type="button" onClick={onLogin} className="btn btn-primary w-100">Login with Manus</button></div></div></div></div><div className="modal-backdrop" /></>;
}
