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
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/StudioUI";
import { Input } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/FormControls";

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
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent>
        <form
          onSubmit={form => {
            form.preventDefault();
            onConfirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t("rooms.moderation.removeTitle", { name: targetName })}
            </DialogTitle>
            <DialogDescription>
              {t("rooms.moderation.removeDetail")}
            </DialogDescription>
            <IconButton
              className="ml-auto h-8 w-8 shrink-0 text-muted hover:bg-surface-3 hover:text-ink"
              label={t("common.close")}
              icon={null}
              onClick={onClose}
            />
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <label className="mb-1.5 block text-sm font-medium text-ink w-full">
              {t("rooms.moderation.reasonLabel")}
              <Textarea
                className="mt-1"
                required
                minLength={3}
                maxLength={280}
                autoFocus

                rows={3}
                value={reason}
                onChange={input => onReasonChange(input.target.value)}
                placeholder={t("rooms.moderation.reasonPlaceholder")}
              />
            </label>
            <div className="mt-1.5 text-xs text-muted">
              {t("rooms.moderation.reasonHint")}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              size="md"
              type="button"

              onClick={onClose}
              disabled={pending}
            >
              {t("rooms.moderation.cancel")}
            </Button>
            <PendingButton
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold leading-none outline-none transition focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 bg-danger text-white hover:brightness-95"
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
