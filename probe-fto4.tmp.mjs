import { puzzles } from "cubing/puzzles";

const cube = await puzzles["fto"].kpuzzle();
const moves = cube.moves;
console.log("moves keys:", moves ? Object.keys(moves).join(" ") : "(none)");

const tries = [
  "Uo", "Ro", "Lo", "Fo", "Bo", "BLo", "BRo", "Do",
  "Uo2", "Ro2", "Lo2", "Fo2", "Bo2", "BLo2", "BRo2", "Do2",
  "Uo'", "Ro'", "Lo'", "Fo'", "Bo'", "BLo'", "BRo'", "Do'",
  "v", "ao", "w", "R2",
];
for (const t of tries) {
  try {
    cube.defaultPattern().applyAlg(t);
    console.log("OK   ", JSON.stringify(t));
  } catch (e) {
    console.log("FAIL ", JSON.stringify(t), "->", String(e).slice(0, 90));
  }
}
