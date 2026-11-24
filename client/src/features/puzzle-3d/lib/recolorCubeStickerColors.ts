type ColorAttribute = {
  normalized?: boolean;
  count: number;
  __z2Flipped?: boolean;
  getX(index: number): number;
  getY(index: number): number;
  getZ(index: number): number;
  setXYZ(index: number, x: number, y: number, z: number): void;
  needsUpdate: boolean;
  array?: Uint8Array;
};

type ColoredGeometry = {
  getAttribute(name: string): ColorAttribute | undefined;
};

type StickerMaterial = {
  color?: {
    r: number;
    g: number;
    b: number;
    setRGB(r: number, g: number, b: number): unknown;
  };
  vertexColors?: boolean;
  __z2Flipped?: boolean;
};

export type ColoredObject = {
  geometry?: ColoredGeometry;
  material?: StickerMaterial | StickerMaterial[];
  traverse(callback: (child: ColoredObject) => void): void;
};

const WHITE = { r: 1, g: 1, b: 1 };
const YELLOW = { r: 1, g: 1, b: 0 };
const ORANGE = { r: 1, g: 128 / 255, b: 0 };
const RED = { r: 1, g: 0, b: 0 };

const SWAPS: ReadonlyArray<readonly [typeof WHITE, typeof WHITE]> = [
  [WHITE, YELLOW],
  [ORANGE, RED],
];

const TOLERANCE = 0.1;

function distance(color: { r: number; g: number; b: number }, anchor: typeof WHITE) {
  return Math.max(
    Math.abs(color.r - anchor.r),
    Math.abs(color.g - anchor.g),
    Math.abs(color.b - anchor.b),
  );
}

function patchBackupBytes(attribute: ColorAttribute): void {
  const raw = attribute.array;
  if (!raw || raw.BYTES_PER_ELEMENT !== 1) return;
  const full = new Uint8Array(raw.buffer);
  const liveBytes = raw.byteLength;
  const start = raw.byteOffset + liveBytes;
  const end = start + liveBytes;
  if (full.length < end) return;
  for (let index = start; index < end; index += 3) {
    const target = matchSwap({
      r: full[index]! / 255,
      g: full[index + 1]! / 255,
      b: full[index + 2]! / 255,
    });
    if (target) {
      full[index] = Math.round(target.r * 255);
      full[index + 1] = Math.round(target.g * 255);
      full[index + 2] = Math.round(target.b * 255);
    }
  }
}

function matchSwap(color: { r: number; g: number; b: number }): typeof WHITE | null {
  for (const [from, to] of SWAPS) {
    if (distance(color, from) <= TOLERANCE) return to;
    if (distance(color, to) <= TOLERANCE) return from;
  }
  return null;
}

export function recolorCubeStickerColors(root: ColoredObject): number {
  let swapped = 0;
  root.traverse(child => {
    const geometry = child.geometry;
    const attribute = geometry?.getAttribute("color");
    if (attribute && !attribute.__z2Flipped) {
      for (let index = 0; index < attribute.count; index += 1) {
        const color = {
          r: attribute.getX(index),
          g: attribute.getY(index),
          b: attribute.getZ(index),
        };
        const target = matchSwap(color);
        if (target) {
          attribute.setXYZ(index, target.r, target.g, target.b);
          swapped += 1;
        }
      }
      patchBackupBytes(attribute);
      attribute.__z2Flipped = true;
      attribute.needsUpdate = true;
    }
    const material = child.material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    for (const entry of materials) {
      if (!entry?.color || entry.vertexColors || entry.__z2Flipped) continue;
      const target = matchSwap(entry.color);
      if (target) {
        entry.color.setRGB(target.r, target.g, target.b);
        entry.__z2Flipped = true;
        swapped += 1;
      }
    }
  });
  return swapped;
}
