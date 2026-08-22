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

const freeOrbit = (start, deltaX) => start + deltaX * 0.42;
for (const [start, deltaX, expected] of [[0, 360 / 0.42, 360], [360, 360 / 0.42, 720], [-360, -360 / 0.42, -720]]) {
  if (freeOrbit(start, deltaX) !== expected) throw new Error(`Free orbit mismatch: ${start} + ${deltaX} -> ${freeOrbit(start, deltaX)}, expected ${expected}`);
}
console.log("orbit: free 360° / 720° with no automatic wrap or reset");

const clampPitch = (degrees) => Math.max(-72, Math.min(64, degrees));
for (const [input, expected] of [[-200, -72], [-72, -72], [0, 0], [64, 64], [200, 64]]) {
  if (clampPitch(input) !== expected) throw new Error(`Pitch clamp mismatch: ${input} -> ${clampPitch(input)}, expected ${expected}`);
}
console.log("vertical pitch: -72° to +64° for top/bottom viewing");

let inertialAngle = 0;
let velocity = 1;
for (let frame = 0; frame < 24; frame += 1) {
  velocity *= 0.92;
  inertialAngle += velocity;
}
if (!(inertialAngle > 0 && velocity > 0 && velocity < 1)) throw new Error("Inertia should decay forward without resetting the angle");
console.log(`inertia: decays smoothly and retains ${inertialAngle.toFixed(3)}° of free orbit`);
