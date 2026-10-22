import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/BootstrapDialog";
import { AVATAR_CROP_FRAME, AvatarCropPlacement, centeredAvatarCrop, clampAvatarCrop, renderAvatarCrop, zoomAvatarCrop } from "@/lib/avatarCrop";
import { useLanguage } from "@/contexts/LanguageContext";

type ImageType = "image/jpeg" | "image/png" | "image/webp";
type DragStart = { pointerId: number; x: number; y: number; placement: AvatarCropPlacement } | null;

export function AvatarCropDialog({ file, onClose, onConfirm }: { file: File | null; onClose: () => void; onConfirm: (blob: Blob, contentType: ImageType) => void }) {
  const { t } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState("");
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [placement, setPlacement] = useState<AvatarCropPlacement>({ zoom: 1, x: 0, y: 0 });
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<DragStart>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(""); setDimensions(null); setError(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url); setDimensions(null); setPlacement({ zoom: 1, x: 0, y: 0 }); setError("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const move = (next: AvatarCropPlacement) => { if (dimensions) setPlacement(clampAvatarCrop(next, dimensions.width, dimensions.height)); };
  const imageLoaded = () => { const image = imageRef.current; if (!image) return; const next = { width: image.naturalWidth, height: image.naturalHeight }; setDimensions(next); setPlacement(centeredAvatarCrop(next.width, next.height)); };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => { const start = drag.current; if (!start || !dimensions || start.pointerId !== event.pointerId) return; move({ ...start.placement, x: start.placement.x + event.clientX - start.x, y: start.placement.y + event.clientY - start.y }); };
  const pointerEnd = (event: React.PointerEvent<HTMLDivElement>) => { if (drag.current?.pointerId === event.pointerId) { drag.current = null; event.currentTarget.releasePointerCapture?.(event.pointerId); } };
  const confirm = async () => {
    const image = imageRef.current;
    if (!file || !image || !dimensions) return;
    setRendering(true);
    setError("");
    try {
      const blob = await renderAvatarCrop(image, placement, file.type as ImageType);
      if (blob.size > 2 * 1024 * 1024) throw new Error(t("profile.crop.tooLarge"));
      onConfirm(blob, file.type as ImageType);
    } catch (next) {
      setError(next instanceof Error ? next.message : t("profile.crop.failed"));
    } finally {
      setRendering(false);
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("profile.crop.title")}</DialogTitle>
            <DialogDescription>{t("profile.crop.description")}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="modal-body">
          <div className="d-flex justify-content-center">
            <div
              className="position-relative overflow-hidden rounded bg-body-tertiary border"
              style={{ width: AVATAR_CROP_FRAME, height: AVATAR_CROP_FRAME, touchAction: "none", cursor: dimensions ? "grab" : "wait" }}
              onPointerDown={(event) => { if (!dimensions) return; drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, placement }; event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={pointerMove}
              onPointerUp={pointerEnd}
              onPointerCancel={pointerEnd}
              aria-label={t("profile.crop.dragLabel")}
            >
              {previewUrl ? (
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt={t("profile.crop.previewAlt")}
                  draggable={false}
                  onLoad={imageLoaded}
                  className="position-absolute user-select-none"
                  style={dimensions ? { width: dimensions.width * (AVATAR_CROP_FRAME / Math.min(dimensions.width, dimensions.height)) * placement.zoom, height: dimensions.height * (AVATAR_CROP_FRAME / Math.min(dimensions.width, dimensions.height)) * placement.zoom, left: placement.x, top: placement.y, maxWidth: "none", pointerEvents: "none" } : { visibility: "hidden" }}
                />
              ) : null}
            </div>
          </div>
          {dimensions ? (
            <label className="form-label w-100 mt-4 mb-0">
              {t("profile.crop.zoom")} <span className="text-body-secondary">{Math.round(placement.zoom * 100)}%</span>
              <input
                type="range"
                className="form-range mt-2"
                min="1"
                max="3"
                step="0.01"
                value={placement.zoom}
                onChange={(event) => setPlacement(zoomAvatarCrop(placement, Number(event.target.value), dimensions.width, dimensions.height))}
              />
            </label>
          ) : <p className="text-body-secondary text-center small mt-3 mb-0">{t("profile.crop.preparing")}</p>}
          {error ? <div className="alert alert-danger small mt-3 mb-0" role="alert">{error}</div> : null}
        </div>
        <DialogFooter>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={rendering}>{t("profile.crop.cancel")}</button>
          <button type="button" className="btn btn-primary" onClick={confirm} disabled={!dimensions || rendering}>{rendering ? t("profile.crop.pending") : t("profile.crop.confirm")}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
