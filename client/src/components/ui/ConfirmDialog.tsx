import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { PendingButton } from "@/components/ui/StudioUI";
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
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 border-line bg-surface text-ink hover:bg-surface-2"
            onClick={onClose}
            disabled={pending}
          >
            {t("common.cancel")}
          </button>
          <PendingButton
            type="button"
            className={
              tone === "danger"
                ? "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-danger text-white shadow-sm hover:brightness-95"
                : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-primary text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
            }
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
