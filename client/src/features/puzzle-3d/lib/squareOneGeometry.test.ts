import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { squareOneObject } from "./squareOneGeometry";

const solvedPieces = Array.from({ length: 24 }, (_, index) => index);

function beltStickerColors(middle: 0 | 1) {
  const object = squareOneObject(THREE, { pieces: solvedPieces, middle });
  const animation = object.userData.squareAnimation as {
    belt: THREE.Group;
  };
  return animation.belt.children
    .filter(child => (child as THREE.Mesh).isMesh)
    .map(child =>
      (
        (child as THREE.Mesh).material as THREE.MeshLambertMaterial
      ).color.getHexString()
    )
    .filter(color => color !== "171d23")
    .sort();
}

describe("Square-1 belt", () => {
  it("renders the four solved side colours instead of a black band", () => {
    expect(beltStickerColors(0)).toEqual(
      ["0046ad", "009b48", "b71234", "ff5800"].sort()
    );
  });

  it("flips the belt with the equator orientation", () => {
    const object = squareOneObject(THREE, { pieces: solvedPieces, middle: 1 });
    const animation = object.userData.squareAnimation as {
      belt: THREE.Group;
    };
    expect(animation.belt.rotation.y).toBeCloseTo(Math.PI);
  });
});
