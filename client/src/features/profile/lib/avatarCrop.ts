export type CroppedAvatarArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const AVATAR_CROP_FRAME = 280;
const AVATAR_OUTPUT_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Không thể tải ảnh đại diện để cắt."));
    image.src = src;
  });
}

export async function renderCroppedAvatar(
  file: Blob,
  area: CroppedAvatarArea,
  contentType: "image/jpeg" | "image/png" | "image/webp",
  outputSize = AVATAR_OUTPUT_SIZE
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể chuẩn bị ảnh đại diện.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      outputSize,
      outputSize
    );
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob =>
          blob
            ? resolve(blob)
            : reject(new Error("Không thể cắt ảnh đại diện.")),
        contentType,
        0.92
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
