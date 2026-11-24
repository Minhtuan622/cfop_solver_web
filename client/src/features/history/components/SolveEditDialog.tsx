import { Check } from "@/components/ui/Icon";
import { MoveComposer } from "@/components/common/MoveComposer";
import { Button, buttonClass } from "@/components/ui/Button";
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
import { IconButton } from "@/components/ui/StudioUI";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SolvePenalty } from "@/lib/solveHistory";
import type { SolveEditor } from "../lib/useSolveEditor";

export function SolveEditDialog({ editor }: { editor: SolveEditor }) {
  const { t } = useLanguage();
  const { editing } = editor;
  return (
    <Dialog
      open={Boolean(editing)}
      onOpenChange={open => !open && editor.close()}
    >
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("history.editTitle")}</DialogTitle>
            <DialogDescription>
              <span className="font-mono break-words">{editing?.input}</span>
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-12 gap-4">
            <label className="col-span-12 md:col-span-6">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("history.baseTime")}
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
                {t("history.penalty")}
              </span>
              <Select
                value={editor.editPenalty}
                onChange={event =>
                  editor.setEditPenalty(event.target.value as SolvePenalty)
                }
              >
                <option value="none">{t("history.noPenalty")}</option>
                <option value="+2">+2</option>
                <option value="DNF">DNF</option>
              </Select>
            </label>
            {editor.supportsReplay ? (
              <div className="col-span-12">
                <MoveComposer
                  value={editor.editSolution}
                  onChange={editor.setEditSolution}
                  label={t("history.recordedSolution")}
                  pasteLabel={t("history.replayHint")}
                />
              </div>
            ) : null}
            {editor.solutionError ? (
              <div className="col-span-12">
                <div className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mb-0">
                  {editor.solutionError}
                </div>
              </div>
            ) : null}
            <label className="col-span-12">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("history.note")}
              </span>
              <Textarea
                value={editor.editNote}
                onChange={event => editor.setEditNote(event.target.value)}
                rows={3}
              />
            </label>
            <label className="col-span-12">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                {t("history.tags")}
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
            {t("history.cancel")}
          </Button>
          <IconButton
            label={t("history.saveSolve")}
            icon={<Check className="text-base" />}
            onClick={editor.save}
            className={`${buttonClass("primary", "md")}`}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
