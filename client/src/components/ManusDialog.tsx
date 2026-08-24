/** Bootstrap-native authentication dialog fallback. */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/BootstrapDialog";

interface ManusDialogProps { title?: string; logo?: string; open?: boolean; onLogin: () => void; onOpenChange?: (open: boolean) => void; onClose?: () => void; }

export function ManusDialog({ title, logo, open = false, onLogin, onOpenChange, onClose }: ManusDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);
  useEffect(() => { if (!onOpenChange) setInternalOpen(open); }, [open, onOpenChange]);
  const handleOpenChange = (nextOpen: boolean) => { if (onOpenChange) onOpenChange(nextOpen); else setInternalOpen(nextOpen); if (!nextOpen) onClose?.(); };
  return <Dialog open={onOpenChange ? open : internalOpen} onOpenChange={handleOpenChange}><DialogContent><DialogHeader><div className="text-center w-100">{logo && <img src={logo} alt="Dialog graphic" className="rounded img-fluid mb-3" style={{ width: "4rem", height: "4rem", objectFit: "contain" }} />}{title && <DialogTitle>{title}</DialogTitle>}<DialogDescription>Please login with Manus to continue</DialogDescription></div></DialogHeader><DialogFooter><button type="button" onClick={onLogin} className="btn btn-primary w-100">Login with Manus</button></DialogFooter></DialogContent></Dialog>;
}
