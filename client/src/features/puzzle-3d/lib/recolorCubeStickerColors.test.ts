import { describe, expect, it } from "vitest";
import {
  recolorCubeStickerColors,
  type ColoredObject,
} from "./recolorCubeStickerColors";

const CHANNELS = [
  [255, 255, 255],
  [255, 255, 0],
  [255, 128, 0],
  [255, 0, 0],
  [0, 255, 0],
  [34, 102, 255],
  [20, 20, 20],
  [221, 221, 221],
] as const;

function makeScene() {
  const values = new Float32Array(CHANNELS.flatMap(sample => sample.map(v => v / 255)));
  const attribute = {
    normalized: false,
    count: CHANNELS.length,
    needsUpdate: false,
    getX(index: number) { return values[index * 3]!; },
    getY(index: number) { return values[index * 3 + 1]!; },
    getZ(index: number) { return values[index * 3 + 2]!; },
    setXYZ(index: number, x: number, y: number, z: number) {
      values[index * 3] = x;
      values[index * 3 + 1] = y;
      values[index * 3 + 2] = z;
    },
  };
  const root: ColoredObject = {
    geometry: { getAttribute: () => attribute },
    traverse(callback) { callback(this); },
  };
  return { root, attribute };
}

describe("recolorCubeStickerColors", () => {
  it("lật chéo: trắng↔vàng và cam↔đỏ, giữ nguyên màu còn lại", () => {
    const { root, attribute } = makeScene();
    const swapped = recolorCubeStickerColors(root);
    expect(swapped).toBe(4);
    expect([attribute.getX(0), attribute.getY(0), attribute.getZ(0)]).toEqual([1, 1, 0]);
    expect([attribute.getX(1), attribute.getY(1), attribute.getZ(1)]).toEqual([1, 1, 1]);
    expect([attribute.getX(2), attribute.getY(2), attribute.getZ(2)]).toEqual([1, 0, 0]);
    expect(attribute.getX(3)).toBeCloseTo(1);
    expect(attribute.getY(3)).toBeCloseTo(128 / 255, 3);
    expect(attribute.getZ(3)).toBe(0);
    expect(attribute.getX(4)).toBe(0);
    expect(attribute.getY(4)).toBe(1);
    expect(attribute.getZ(5)).toBeCloseTo(1);
    expect(attribute.getX(6)).toBeLessThan(0.1);
    expect(attribute.getZ(7)).toBeCloseTo(221 / 255, 2);
    expect(attribute.needsUpdate).toBe(true);
  });

  it("idempotent: lật hai lần vẫn giữ màu z2", () => {
    const { root, attribute } = makeScene();
    const first = recolorCubeStickerColors(root);
    const second = recolorCubeStickerColors(root);
    expect(first).toBe(4);
    expect(second).toBe(0);
    expect([attribute.getX(0), attribute.getY(0), attribute.getZ(0)]).toEqual([1, 1, 0]);
  });

  it("lật cả bản backup trong cùng buffer (chống nhảy màu khi animation)", () => {
    const live = new Uint8Array([
      255, 255, 255,
      255, 255, 0,
      255, 128, 0,
      255, 0, 0,
    ]);
    const buffer = new Uint8Array(live.length * 2);
    buffer.set(live, 0);
    buffer.set(live, live.length);
    const attribute = {
      normalized: false,
      count: 4,
      needsUpdate: false,
      array: buffer.subarray(0, live.length),
      getX(index: number) { return buffer[index * 3]! / 255; },
      getY(index: number) { return buffer[index * 3 + 1]! / 255; },
      getZ(index: number) { return buffer[index * 3 + 2]! / 255; },
      setXYZ(index: number, x: number, y: number, z: number) {
        buffer[index * 3] = Math.round(x * 255);
        buffer[index * 3 + 1] = Math.round(y * 255);
        buffer[index * 3 + 2] = Math.round(z * 255);
      },
    };
    const root: ColoredObject = {
      geometry: { getAttribute: () => attribute },
      traverse(callback) { callback(this); },
    };
    const swapped = recolorCubeStickerColors(root);
    expect(swapped).toBe(4);
    const backup = buffer.subarray(live.length);
    expect([...backup.subarray(0, 3)]).toEqual([255, 255, 0]);
    expect([...backup.subarray(3, 6)]).toEqual([255, 255, 255]);
    expect([...backup.subarray(6, 9)]).toEqual([255, 0, 0]);
    expect([...backup.subarray(9, 12)]).toEqual([255, 128, 0]);
  });
});
