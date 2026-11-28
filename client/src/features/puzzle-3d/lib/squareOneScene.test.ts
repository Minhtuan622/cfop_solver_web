import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { SQ1_SOLVED, applyToken, canSlice, turnLayers } from "@/lib/squareOneModel";
import { createSquareOneModel } from "./squareOneScene";
import { placementsOf } from "./squareOneGeometry";

// Where the first vertex of every piece ends up, which pins down both its place
// and which way up it is.
function fingerprint(model: ReturnType<typeof createSquareOneModel>) {
  model.root.updateMatrixWorld(true);
  const points: string[] = [];
  model.root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute("position");
    const sample = new THREE.Vector3();
    const sum = new THREE.Vector3();
    for (let index = 0; index < position.count; index += 1) {
      sample.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
      sum.add(sample);
    }
    sum.divideScalar(position.count);
    const first = new THREE.Vector3().fromBufferAttribute(position, 0).applyMatrix4(mesh.matrixWorld);
    points.push([sum, first].map(vector => [vector.x, vector.y, vector.z].map(value => (Math.abs(value) < 5e-4 ? 0 : value).toFixed(3)).join(",")).join("|"));
  });
  return points.sort();
}

describe("square-one 3D model", () => {
  it("lays the solved puzzle out as a cube of the expected height", () => {
    const model = createSquareOneModel(THREE);
    model.pose(SQ1_SOLVED, 0);
    const box = new THREE.Box3().setFromObject(model.root);
    expect(box.max.y).toBeCloseTo(0.99, 1);
    expect(box.min.y).toBeCloseTo(-0.99, 1);
    expect(box.max.x).toBeLessThanOrEqual(1.42);
    expect(box.min.x).toBeGreaterThanOrEqual(-1.42);
    expect(placementsOf(SQ1_SOLVED)).toHaveLength(16);
  });

  it("ends a turn and a slice exactly where the next state is drawn", () => {
    const model = createSquareOneModel(THREE);
    const reference = createSquareOneModel(THREE);
    let state: number[] = SQ1_SOLVED.slice();
    let flips = 0;
    const tokens: Array<[number, number]> = [[0, -1], [3, 2], [-3, 0], [1, -2], [6, 3]];
    for (const [top, bottom] of tokens) {
      if (!canSlice(turnLayers(state, top, bottom))) continue;
      const turned = turnLayers(state, top, bottom);
      model.pose(state, flips, { kind: "turn", top, bottom, progress: 1 });
      reference.pose(turned, flips);
      expect(fingerprint(model)).toEqual(fingerprint(reference));
      model.pose(turned, flips, { kind: "slice", progress: 1 });
      state = applyToken(state, { top, bottom, slice: true });
      flips += 1;
      reference.pose(state, flips);
      expect(fingerprint(model)).toEqual(fingerprint(reference));
    }
    expect(flips).toBeGreaterThan(0);
  });

  it("turns the middle layer over after an odd number of slices", () => {
    const model = createSquareOneModel(THREE);
    model.pose(SQ1_SOLVED, 0);
    const before = fingerprint(model);
    model.pose(SQ1_SOLVED, 1);
    const odd = fingerprint(model);
    model.pose(SQ1_SOLVED, 2);
    expect(odd).not.toEqual(before);
    expect(fingerprint(model)).toEqual(before);
  });
});
