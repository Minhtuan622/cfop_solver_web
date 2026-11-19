// Offline rebuild of the HCubist FTO model (regular octahedron, corner in front).
const sqrt3 = Math.sqrt(3);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const unit = a => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export function buildFto() {
  const names = ["U", "F", "R", "L", "B", "BL", "BR", "D"];
  const A = { U: [1, 1, 1], L: [1, 1, -1], R: [-1, 1, 1], B: [1, -1, 1] };
  const S = {};
  names.forEach(n => { if (A[n]) S[n] = A[n]; });
  S.D = S.U.map(v => -v);
  S.F = S.B.map(v => -v);
  S.BL = S.R.map(v => -v);
  S.BR = S.L.map(v => -v);

  const k8 = Math.sqrt(8) / 3;
  const T = { U: [0, 1, 0], L: [-(k8 * sqrt3) / 2, 1 / 3, k8 / 2] };

  const basis = (a, b) => {
    const e1 = unit(a);
    const e2 = unit(sub(b, e1.map(v => v * dot(b, e1))));
    const e3 = cross(e1, e2);
    return [e1, e2, e3];
  };
  const E = basis(S.U, S.L);
  const Fm = basis(T.U, T.L);
  const Q = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) Q[i * 3 + j] += Fm[k][i] * E[k][j];
  const mvQ = v => [
    Q[0] * v[0] + Q[3] * v[1] + Q[6] * v[2],
    Q[1] * v[0] + Q[4] * v[1] + Q[7] * v[2],
    Q[2] * v[0] + Q[5] * v[1] + Q[8] * v[2],
  ];
  const N = {};
  names.forEach(n => { N[n] = mvQ(unit(S[n])); });

  const stickers = [];
  names.forEach((nm, fi) => {
    const s = S[nm];
    const a = [s[0], 0, 0], b = [0, s[1], 0], c = [0, 0, s[2]];
    const nn = N[nm];
    const P3 = (x, y, z) => [(a[0] * x + b[0] * y + c[0] * z) / 3, (a[1] * x + b[1] * y + c[1] * z) / 3, (a[2] * x + b[2] * y + c[2] * z) / 3];
    const tri = (p, q, r) => {
      const pp = [p, q, r].map(mvQ);
      const centroid = [(pp[0][0] + pp[1][0] + pp[2][0]) / 3, (pp[0][1] + pp[1][1] + pp[2][1]) / 3, (pp[0][2] + pp[1][2] + pp[2][2]) / 3];
      stickers.push({ f: fi, n: nn, poly: pp, c: centroid });
    };
    for (let x = 0; x <= 2; x++) for (let y = 0; y <= 2 - x; y++) {
      const z = 2 - x - y;
      tri(P3(x + 1, y, z), P3(x, y + 1, z), P3(x, y, z + 1));
    }
    for (let x = 0; x <= 1; x++) for (let y = 0; y <= 1 - x; y++) {
      const z = 1 - x - y;
      tri(P3(x, y + 1, z + 1), P3(x + 1, y, z + 1), P3(x + 1, y + 1, z));
    }
  });
  return { names, stickers, N };
}
