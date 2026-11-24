import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { faceletsToPainting, paintingToFacelets } from "../lib/faceletMap";
import type { StateModel } from "../lib/puzzleState";
import { loadStateModel, solvedStatePainting } from "../lib/stateSolve";
import { PuzzleStatePainter } from "./PuzzleStatePainter";

export function FaceletStatePainter({
  value,
  onChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  disabled = false,
}: {
  value: string;
  onChange: (state: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [model, setModel] = useState<StateModel | null>(null);
  const [brush, setBrush] = useState("U");

  useEffect(() => {
    let cancelled = false;
    void loadStateModel("3x3x3").then(loaded => {
      if (!cancelled) setModel(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || disabled) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        onUndo();
      } else if ((key === "y" || (key === "z" && event.shiftKey)) && canRedo) {
        event.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUndo, canRedo, disabled, onUndo, onRedo]);

  const painting = useMemo(
    () => (model ? faceletsToPainting(model, value) : {}),
    [model, value]
  );

  if (!model)
    return <p className="mb-0 text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div>
      <PuzzleStatePainter
        kpuzzleId="3x3x3"
        model={model}
        painting={painting}
        onChange={next => onChange(paintingToFacelets(model, next, value))}
        brush={brush}
        onBrushChange={setBrush}
        onReset={() =>
          void solvedStatePainting("3x3x3").then(solved =>
            onChange(paintingToFacelets(model, solved, value))
          )
        }
        lockedOrbits={["CENTERS"]}
        disabled={disabled}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="soft" size="sm" disabled={!canUndo || disabled} onClick={onUndo}>
          {t("otherPuzzles.state.undo")}
        </Button>
        <Button variant="soft" size="sm" disabled={!canRedo || disabled} onClick={onRedo}>
          {t("otherPuzzles.state.redo")}
        </Button>
      </div>
    </div>
  );
}
