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
  targetName: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
};

/** Asks the moderator for a reason before a spectator is removed from the room. */
export function RemoveSpectatorDialog({
  open,
  targetName,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  pending,
}: Props) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={next => {
      if (!next) onClose();
    }}>
      <DialogContent>
        <form
          onSubmit={form => {
            form.preventDefault();
            onConfirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("rooms.moderation.removeTitle", { name: targetName })}</DialogTitle>
            <DialogDescription>{t("rooms.moderation.removeDetail")}</DialogDescription>
            <button
              type="button"
              className="btn-close"
              aria-label={t("common.close")}
              onClick={onClose}
            />
          </DialogHeader>
          <div className="modal-body">
            <label className="form-label w-100">
              {t("rooms.moderation.reasonLabel")}
              <textarea
                required
                minLength={3}
                maxLength={280}
                autoFocus
                className="form-control mt-1"
                rows={3}
                value={reason}
                onChange={input => onReasonChange(input.target.value)}
                placeholder={t("rooms.moderation.reasonPlaceholder")}
              />
            </label>
            <div className="form-text">{t("rooms.moderation.reasonHint")}</div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={pending}
            >
              {t("rooms.moderation.cancel")}
            </button>
            <PendingButton
              className="btn btn-danger"
              disabled={reason.trim().length < 3}
              pending={pending}
            >
              {t("rooms.moderation.confirm")}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
