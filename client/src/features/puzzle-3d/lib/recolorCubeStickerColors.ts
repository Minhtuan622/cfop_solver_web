/**
 * Recolours the stickers of Cubing.js's 3×3-family puzzles to the studio
 * z2 scheme in place: yellow up / white down, red left / orange right,
 * chirality preserved.
 *
 * Two engines render these puzzles:
 *  - Cube3D (3×3×3 / 2×2×2): six module-level `MeshBasicMaterial`s hold the
 *    face colours, baked at import time. We flip the colour on the shared
 *    instance once and every mounted cube follows.
 *  - PG3D (4×4×4 and up): colours live in a vertex-colour attribute, and
 *    the shared materials are colourless (`vertexColors: true`). We flip
 *    the attribute in place; the shared materials must NOT be touched
 *    (they multiply every vertex). The filler also keeps a 1:1 backup
 *    inside the same Uint8Array — animation flashes rewrite the live
 *    bytes from it, so we flip the backup too (see `patchBackupBytes`).
 *
 * The whole cube flips together — including a case sitting on the
 * (formerly white) layer.
 */
type ColorAttribute = {
  normalized?: boolean;
  count: number;
  /** Module instances are shared across frames; only flip once. */
  __z2Flipped?: boolean;
  getX(index: number): number;
  getY(index: number): number;
  getZ(index: number): number;
  setXYZ(index: number, x: number, y: number, z: number): void;
  needsUpdate: boolean;
  /** Raw bytes view — PG3D colours live in one Uint8Array (live bytes + backup). */
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
  /** PG3D materials are colourless and already carry vertex colours. */
  vertexColors?: boolean;
  /** Module instances are shared across frames; only flip once. */
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

/**
 * PG3D keeps a 1:1 copy of the sticker colours in the same Uint8Array,
 * immediately behind the live region ([live | backup]). Animation flashes and
 * stickering updates rewrite the live region from that backup, so it must be
 * flipped too — otherwise the swapped colours revert to the originals the
 * moment any sticker animates ("nhảy màu" while a face is turning).
 */
function patchBackupBytes(attribute: ColorAttribute): void {
  const raw = attribute.array;
  if (!raw || raw.BYTES_PER_ELEMENT !== 1) return;
  const full = new Uint8Array(raw.buffer);
  const liveBytes = raw.byteLength;
  const start = raw.byteOffset + liveBytes;
  const end = start + liveBytes;
  if (full.length < end) return; // layout is not [live | backup] — nothing to patch
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
