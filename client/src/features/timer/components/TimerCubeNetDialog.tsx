/** Hộp thoại phóng to sơ đồ khối sau khi tráo của một lượt giải. */
import { CubeNet } from "@/components/common/CubeNet";
import { type SolveHistoryEntry } from "@/lib/solveHistory";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { Button } from "@/components/ui/Button";

import { safeScrambleState } from "../lib/timerScrambleState";

export function TimerCubeNetDialog({
  entry,
  onClose,
}: {
  entry: SolveHistoryEntry | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={Boolean(entry)}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>CubeNet · Scramble</DialogTitle>
            <DialogDescription>
              <span className="font-mono break-words">
                {entry?.input}
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex justify-center">
          {entry && (
            <CubeNet
              state={safeScrambleState(
                entry.input,
                entry.eventId
              )}
            />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
          >
            {t("timer.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
