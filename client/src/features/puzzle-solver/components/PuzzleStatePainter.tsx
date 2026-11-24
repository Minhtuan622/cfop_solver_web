import { CUBE_COLORS } from "@/features/puzzle-3d/lib/cubeColors";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import {
  colorCountsMatch,
  type KPuzzleId,
  type Painting,
  type StateModel,
} from "../lib/puzzleState";

export function stateColor(kpuzzleId: KPuzzleId, face: string, fill: string) {
  return kpuzzleId === "2x2x2" || kpuzzleId === "3x3x3"
    ? (CUBE_COLORS[face] ?? fill)
    : fill;
}

export function PuzzleStatePainter({
  kpuzzleId,
  model,
  painting,
  onChange,
  brush,
  onBrushChange,
  onReset,
  lockedOrbits = [],
  disabled = false,
}: {
  kpuzzleId: KPuzzleId;
  model: StateModel;
  painting: Painting;
  onChange: (next: Painting) => void;
  brush: string;
  onBrushChange: (face: string) => void;
  onReset: () => void;
  lockedOrbits?: string[];
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const fills = new Map(model.faces.map(face => [face.name, face.fill]));
  const orbitOf = new Map(model.stickers.map(sticker => [sticker.id, sticker.orbit]));
  const paint = (id: string) => {
    if (disabled || lockedOrbits.includes(orbitOf.get(id) ?? "")) return;
    const next = { ...painting };
    for (const target of model.groups[id] ?? [id]) next[target] = brush;
    onChange(next);
  };
  const counted = colorCountsMatch(model, painting);

  return (
    <div>
      <div
        role="group"
        aria-label={t("otherPuzzles.state.palette")}
        className="mb-3 flex flex-wrap items-center gap-2"
      >
        {model.faces.map(face => (
          <button
            key={face.name}
            type="button"
            aria-pressed={brush === face.name}
            aria-label={t("otherPuzzles.state.color", { face: face.name })}
            disabled={disabled}
            onClick={() => onBrushChange(face.name)}
            className={cn(
              "size-9 rounded-full transition focus-visible:ring-4 focus-visible:ring-primary/20",
              brush === face.name ? "ring-4 ring-primary/60" : "ring-2 ring-line"
            )}
            style={{ background: stateColor(kpuzzleId, face.name, face.fill) }}
          />
        ))}
        <Button variant="soft" size="sm" onClick={onReset} disabled={disabled}>
          {t("otherPuzzles.state.reset")}
        </Button>
      </div>
      <svg
        viewBox={model.viewBox}
        role="group"
        aria-label={t("otherPuzzles.state.net")}
        className="mx-auto block max-h-96 w-full rounded-panel bg-surface-2"
      >
        {model.stickers.map(sticker => {
          const face = painting[sticker.id] ?? sticker.face;
          return (
            <polygon
              key={sticker.id}
              data-sticker={sticker.id}
              points={sticker.points}
              fill={stateColor(kpuzzleId, face, fills.get(face) ?? sticker.fill)}
              strokeWidth={1.5}
              className={cn(
                "stroke-canvas",
                !disabled && !lockedOrbits.includes(sticker.orbit) && "cursor-pointer"
              )}
              onClick={() => paint(sticker.id)}
            />
          );
        })}
      </svg>
      <p
        role="status"
        className={cn("mt-3 mb-0 text-sm", counted ? "text-muted" : "text-danger")}
      >
        {counted ? t("otherPuzzles.state.hint") : t("otherPuzzles.state.counts")}
      </p>
    </div>
  );
}
