import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/StudioDialog";
import {
  AVATAR_CROP_FRAME,
  renderCroppedAvatar,
} from "@/lib/avatarCrop";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";

type ImageType = "image/jpeg" | "image/png" | "image/webp";

export function AvatarCropDialog({
  file,
  onClose,
  onConfirm,
}: {
  file: File | null;
  onClose: () => void;
  onConfirm: (blob: Blob, contentType: ImageType) => void;
}) {
  const { t } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState("");
  const [ready, setReady] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setReady(false);
      setCroppedArea(null);
      setError("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setReady(false);
    setCroppedArea(null);
    setError("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const confirm = async () => {
    if (!file || !croppedArea) return;
    setRendering(true);
    setError("");
    try {
      const blob = await renderCroppedAvatar(
        file,
        croppedArea,
        file.type as ImageType
      );
      if (blob.size > 2 * 1024 * 1024)
        throw new Error(t("profile.crop.tooLarge"));
      onConfirm(blob, file.type as ImageType);
    } catch (next) {
      setError(next instanceof Error ? next.message : t("profile.crop.failed"));
    } finally {
      setRendering(false);
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{t("profile.crop.title")}</DialogTitle>
            <DialogDescription>
              {t("profile.crop.description")}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-xl bg-surface-2"
              style={{ width: AVATAR_CROP_FRAME, height: AVATAR_CROP_FRAME }}
            >
              {previewUrl ? (
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  minZoom={1}
                  maxZoom={3}
                  zoomSpeed={0.2}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, areaPixels) =>
                    setCroppedArea(areaPixels)
                  }
                  onMediaLoaded={() => setReady(true)}
                  cropperProps={{
                    "aria-label": t("profile.crop.dragLabel"),
                  }}
                  style={{
                    containerStyle: {
                      borderRadius: "inherit",
                    },
                  }}
                />
              ) : null}
            </div>
          </div>
          {ready ? (
            <label className="mb-1.5 block text-sm font-medium text-ink w-full mt-6 mb-0">
              {t("profile.crop.zoom")}{" "}
              <span className="text-muted">{Math.round(zoom * 100)}%</span>
              <input
                type="range"
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-primary mt-2"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={event => setZoom(Number(event.target.value))}
              />
            </label>
          ) : (
            <p className="text-muted text-center text-sm mt-4 mb-0">
              {t("profile.crop.preparing")}
            </p>
          )}
          {error ? (
            <div
              className="rounded-panel px-4 py-3 text-sm bg-danger-soft text-ink mt-4 mb-0"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={onClose}
            disabled={rendering}
          >
            {t("profile.crop.cancel")}
          </Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={confirm}
            disabled={!croppedArea || rendering}
          >
            {rendering ? t("profile.crop.pending") : t("profile.crop.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
