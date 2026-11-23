import { buttonClass } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";

/** Hộp thoại xác nhận xoá toàn bộ lịch sử của trang Chơi. */
export function PlayClearDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Số lượt sẽ bị xoá (hiện trong lời nhắc). */
  count: number;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("play.clearTitle")}</DialogTitle>
          <DialogDescription>
            {t("play.clearDetail", { count })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className={buttonClass("secondary", "md")}
            onClick={() => onOpenChange(false)}
          >
            {t("play.cancel")}
          </button>
          <button
            type="button"
            className={buttonClass("dangerSolid", "md")}
            onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
          >
            {t("play.clearConfirm")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
