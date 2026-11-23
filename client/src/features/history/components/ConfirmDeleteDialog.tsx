import { Trash2 } from "@/components/ui/Icon";
import { Button, buttonClass } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { IconButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";

/** Hộp thoại xác nhận xoá (một lượt hoặc các lượt đã chọn). */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t("history.cancel")}
          </Button>
          <IconButton
            label={confirmLabel}
            icon={<Trash2 className="text-base" />}
            className={`${buttonClass("secondary", "md")}`}
            onClick={onConfirm}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
