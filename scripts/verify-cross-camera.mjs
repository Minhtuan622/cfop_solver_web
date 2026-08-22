const normals = { U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1], D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1] };

function rotateX([x, y, z], degrees) {
  const a = degrees * Math.PI / 180;
  return [x, Math.cos(a) * y - Math.sin(a) * z, Math.sin(a) * y + Math.cos(a) * z];
}
function rotateY([x, y, z], degrees) {
  const a = degrees * Math.PI / 180;
  return [Math.cos(a) * x + Math.sin(a) * z, y, -Math.sin(a) * x + Math.cos(a) * z];
}
function rotateZ([x, y, z], degrees) {
  const a = degrees * Math.PI / 180;
  return [Math.cos(a) * x - Math.sin(a) * y, Math.sin(a) * x + Math.cos(a) * y, z];
}
function normalize(face, vector) {
  if (face === "U") return rotateX(vector, 180);
  if (face === "F") return rotateX(vector, 90);
  if (face === "B") return rotateX(vector, -90);
  if (face === "R") return rotateZ(vector, -90);
  if (face === "L") return rotateZ(vector, 90);
  return vector;
}
function orient(face, orbit) {
  let vector = normalize(face, normals[face]);
  vector = rotateY(vector, 34);
  vector = rotateX(vector, -26);
  return rotateY(vector, orbit).map((value) => Number(value.toFixed(8)));
}

for (const orbit of [-125, 0, 125]) {
  const results = Object.fromEntries(Object.keys(normals).map((face) => [face, orient(face, orbit)]));
  const reference = JSON.stringify(results.D);
  if (Object.values(results).some((result) => JSON.stringify(result) !== reference)) throw new Error(`Cross camera mismatch at orbit ${orbit}: ${JSON.stringify(results)}`);
  console.log(`orbit ${orbit}: U/R/F/D/L/B all share ${reference}`);
}

const wrapOrbit = (degrees) => ((degrees + 180) % 360 + 360) % 360 - 180;
for (const [input, expected] of [[0, 0], [360, 0], [720, 0], [540, -180], [-540, -180], [361, 1]]) {
  if (wrapOrbit(input) !== expected) throw new Error(`Orbit wrap mismatch: ${input} -> ${wrapOrbit(input)}, expected ${expected}`);
}
console.log("orbit wrap: 360° continuous");
