import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/BootstrapDialog";

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
            <DialogTitle>Loại {targetName}</DialogTitle>
            <DialogDescription>
              Ghi rõ lý do để người xem nhận được thông báo và phòng có nhật ký
              kiểm duyệt.
            </DialogDescription>
            <button
              type="button"
              className="btn-close"
              aria-label="Đóng"
              onClick={onClose}
            />
          </DialogHeader>
          <div className="modal-body">
            <label className="form-label w-100">
              Lý do loại người xem
              <textarea
                required
                minLength={3}
                maxLength={280}
                autoFocus
                className="form-control mt-1"
                rows={3}
                value={reason}
                onChange={input => onReasonChange(input.target.value)}
                placeholder="Ví dụ: Spam trong tên hiển thị hoặc làm gián đoạn phòng."
              />
            </label>
            <div className="form-text">
              Lý do sẽ hiển thị trong toast của spectator và nhật ký kiểm duyệt.
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className="btn btn-danger"
              disabled={pending || reason.trim().length < 3}
            >
              Xác nhận loại
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
