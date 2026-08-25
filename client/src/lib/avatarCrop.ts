export type AvatarCropPlacement = { x: number; y: number; zoom: number };

export const AVATAR_CROP_FRAME = 280;
export const AVATAR_OUTPUT_SIZE = 512;

function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)); }

export function avatarCoverScale(imageWidth: number, imageHeight: number, frame = AVATAR_CROP_FRAME) {
  return Math.max(frame / imageWidth, frame / imageHeight);
}

export function clampAvatarCrop(placement: AvatarCropPlacement, imageWidth: number, imageHeight: number, frame = AVATAR_CROP_FRAME): AvatarCropPlacement {
  const zoom = clamp(placement.zoom, 1, 3);
  const scale = avatarCoverScale(imageWidth, imageHeight, frame) * zoom;
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  return { zoom, x: clamp(placement.x, frame - renderedWidth, 0), y: clamp(placement.y, frame - renderedHeight, 0) };
}

export function centeredAvatarCrop(imageWidth: number, imageHeight: number, frame = AVATAR_CROP_FRAME): AvatarCropPlacement {
  const scale = avatarCoverScale(imageWidth, imageHeight, frame);
  return clampAvatarCrop({ zoom: 1, x: (frame - imageWidth * scale) / 2, y: (frame - imageHeight * scale) / 2 }, imageWidth, imageHeight, frame);
}

export function zoomAvatarCrop(placement: AvatarCropPlacement, nextZoom: number, imageWidth: number, imageHeight: number, frame = AVATAR_CROP_FRAME): AvatarCropPlacement {
  const previousScale = avatarCoverScale(imageWidth, imageHeight, frame) * placement.zoom;
  const nextScale = avatarCoverScale(imageWidth, imageHeight, frame) * nextZoom;
  const focusX = (frame / 2 - placement.x) / (imageWidth * previousScale);
  const focusY = (frame / 2 - placement.y) / (imageHeight * previousScale);
  return clampAvatarCrop({ zoom: nextZoom, x: frame / 2 - focusX * imageWidth * nextScale, y: frame / 2 - focusY * imageHeight * nextScale }, imageWidth, imageHeight, frame);
}

export function renderAvatarCrop(image: HTMLImageElement, placement: AvatarCropPlacement, contentType: "image/jpeg" | "image/png" | "image/webp", frame = AVATAR_CROP_FRAME, outputSize = AVATAR_OUTPUT_SIZE) {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể chuẩn bị ảnh đại diện.");
  const scale = avatarCoverScale(image.naturalWidth, image.naturalHeight, frame) * placement.zoom;
  const factor = outputSize / frame;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, placement.x * factor, placement.y * factor, image.naturalWidth * scale * factor, image.naturalHeight * scale * factor);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Không thể cắt ảnh đại diện.")), contentType, 0.92));
}
