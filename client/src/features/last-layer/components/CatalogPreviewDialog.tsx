import type { ComponentType } from "react";
import { IconButton } from "@/components/ui/StudioUI";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  CatalogExplorerCase,
  CatalogExplorerPreviewProps,
} from "../lib/catalogExplorerTypes";

export function CatalogPreviewDialog({
  previewCase,
  previewHint,
  DialogPreview,
  replayToken,
  canReplay,
  replayLabel,
  onClose,
  onReplay,
  onStudy,
}: {
  previewCase: CatalogExplorerCase | null;
  previewHint: string;
  DialogPreview: ComponentType<CatalogExplorerPreviewProps>;
  replayToken: number;
  canReplay: boolean;
  replayLabel: string | undefined;
  onClose: () => void;
  onReplay: () => void;
  onStudy: (catalogCase: CatalogExplorerCase) => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog
      open={Boolean(previewCase)}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full overflow-hidden">
        <DialogHeader>
          <div>
            <DialogTitle>
              {previewCase
                ? (previewCase.name ??
                  `${previewCase.family.toUpperCase()} · ${previewCase.id}`)
                : t("study.previewTitle")}
            </DialogTitle>
            <DialogDescription>{previewHint}</DialogDescription>
          </div>
          <IconButton
            className="ml-auto h-8 w-8 shrink-0 text-muted hover:bg-surface-3 hover:text-ink"
            label={t("study.closePreview")}
            icon={null}
            onClick={onClose}
          />
        </DialogHeader>
        {previewCase ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col items-center gap-4 p-4 sm:p-6 overflow-auto">
            <DialogPreview
              state={previewCase.state}
              label={previewCase.id}
              family={previewCase.family}
              algorithm={previewCase.algorithm}
              replayToken={replayToken}
            />
            <div className="text-center w-full">
              <strong>{previewCase.group}</strong>
              <code className="block text-sm text-muted mt-2 break-words">
                {previewCase.algorithm}
              </code>
            </div>
          </div>
        ) : null}
        <DialogFooter className="flex-col sm:flex-row">
          <Button
            variant="secondary"
            size="md"
            className="w-full sm:grow-0"
            type="button"

            onClick={onClose}
          >
            {t("study.close")}
          </Button>
          {canReplay && replayLabel ? (
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:grow-0"
              type="button"
              onClick={onReplay}
              aria-label={replayLabel}
            >
              {replayLabel}
            </Button>
          ) : null}
          {previewCase ? (
            <Button
              variant="primary"
              size="md"
              className="w-full sm:grow-0"
              type="button"

              onClick={() => onStudy(previewCase)}
            >
              {t("study.studyThisCase")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
