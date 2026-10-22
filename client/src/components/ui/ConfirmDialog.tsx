import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/BootstrapDialog";
import { PendingButton } from "@/components/ui/BootstrapUI";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  /** The label of the button that carries the action out. */
  confirmLabel: string;
  /** `danger` for the actions that cannot be undone. */
  tone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Asks for a confirmation before an action that cannot be undone. It replaces
 * the native `window.confirm`, so the prompt looks like the rest of the app
 * and keeps the keyboard focus inside the dialog.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  pending = false,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={pending}
          >
            {t("common.cancel")}
          </button>
          <PendingButton
            type="button"
            className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
            pending={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </PendingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
