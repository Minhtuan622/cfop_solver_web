import { useLanguage } from "@/contexts/LanguageContext";
import { CUBE_COLORS, CUBE_FALLBACK_COLOR } from "../lib/cubeColors";
import { FACE_OFFSET, FACE_ORDER } from "../lib/cubeGuideFacelets";

export function CubeGuide3DFallback({
  state,
  dimension,
  surface,
  stageBackground,
}: {
  state: string;
  dimension: 2 | 3;
  surface: "dark" | "light";
  stageBackground: string;
}) {
  const { language } = useLanguage();
  const stickerIndexes = dimension === 2 ? [0, 2, 6, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return (
      <div
        className="grid min-h-84 w-full place-items-center rounded-card"
        style={{ background: stageBackground }}
        aria-label={language === "vi" ? "Mô hình Rubik 3D của bạn" : "3D Rubik model"}
      >
        <div className="grid grid-cols-4 gap-2" data-testid="cube-3d-fallback">
          {FACE_ORDER.map(face => (
            <div
              key={face}
              data-testid={`face-${face}`}
              className="cube3d-face-fallback grid gap-1 rounded-lg bg-black/40 p-1.5"
              style={{ gridTemplateColumns: `repeat(${dimension}, 1fr)` }}
            >
              {stickerIndexes.map(index => {
                const letter = state[FACE_OFFSET[face] + index] ?? "?";
                return (
                  <span
                    key={index}
                    className="cube3d-sticker-fallback h-5 w-5 rounded-sm"
                    style={{ background: CUBE_COLORS[letter] ?? CUBE_FALLBACK_COLOR }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p
          className={
            surface === "light"
              ? "pb-3 text-[11px] text-ink/60"
              : "pb-3 text-[11px] text-white/60"
          }
        >
          {language === "vi"
            ? "Thiết bị không hỗ trợ WebGL — hiển thị 2D."
            : "Device does not support WebGL — 2D preview."}
        </p>
      </div>
  );
}
