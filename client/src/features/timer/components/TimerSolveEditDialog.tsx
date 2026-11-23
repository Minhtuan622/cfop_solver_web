import { MoveComposer } from "@/components/common/MoveComposer";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/FormControls";
import { Select } from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolvePenalty } from "@/lib/solveHistory";
import type { TimerSolveEditor } from "../lib/useTimerSolveEditor";

/** Hộp thoại sửa một lượt giải trên trang Bấm giờ; state nằm trong `useTimerSolveEditor`. */
export function TimerSolveEditDialog({ editor }: { editor: TimerSolveEditor }) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={Boolean(editor.editing)}
      onOpenChange={open => !open && editor.close()}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("timer.edit")}</DialogTitle>
            <DialogDescription>
              <span className="font-mono break-words">
                {editor.editing?.input}
              </span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-12 gap-4">
            <label className="col-span-12 md:col-span-6">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("timer.base")}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editor.editSeconds}
                onChange={event => editor.setEditSeconds(event.target.value)}
              />
            </label>
            <label className="col-span-12 md:col-span-6">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("timer.penalty")}
              </span>
              <Select
                value={editor.editPenalty}
                onChange={event =>
                  editor.setEditPenalty(event.target.value as SolvePenalty)
                }
              >
                <option value="none">{t("timer.noPenalty")}</option>
                <option value="+2">{t("timer.plusTwo")}</option>
                <option value="DNF">{t("timer.dnf")}</option>
              </Select>
            </label>
            <div className="col-span-12">
              <MoveComposer
                value={editor.editSolution}
                onChange={editor.changeSolution}
                label={t("timer.solution")}
                pasteLabel={t("timer.solutionHint")}
              />
            </div>
            {editor.solutionError && (
              <div className="col-span-12">
                <div
                  role="alert"
                  className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mb-0"
                >
                  {editor.solutionError}
                </div>
              </div>
            )}
            <label className="col-span-12">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("timer.note")}
              </span>
              <Textarea
                value={editor.editNote}
                onChange={event => editor.setEditNote(event.target.value)}
                rows={3}
              />
            </label>
            <label className="col-span-12">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("timer.tags")}
              </span>
              <Input
                value={editor.editTags}
                onChange={event => editor.setEditTags(event.target.value)}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={editor.close}
          >
            {t("timer.cancel")}
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={editor.save}
          >
            {t("timer.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
