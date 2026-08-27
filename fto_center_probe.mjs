import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";

const phases = [
  "L' U' BR' R F L'",
  "U' BL F' R' U' R' 2R U'",
  "U 2R U' R U 2R' U' R' 2R' U R'",
  "U' 2R' U R U r U' 2R' R U R' U' R U R'",
  "U 2R U' 2R F' U' F U BL",
  "R B' R' B U R' L R L' U' R' L R L' F D' F U F' D F U' F",
];
const inverse = phases.join(" ").split(/\s+/).reverse().map((move) => move.endsWith("'") ? move.slice(0, -1) : `${move}'`).join(" ");

const kpuzzle = await puzzles.fto.kpuzzle();
for (let index = 0; index < phases.length; index += 1) {
  const svg = await puzzles.fto.svg(kpuzzle.defaultPattern().applyAlg(new Alg(`${inverse} ${phases.slice(0, index + 1).join(" ")}`)));
  const uniformCenters = [...svg.matchAll(/<g id="([A-Z]+)"[^>]*>([\s\S]*?)<\/g>/g)].flatMap(([, face, body]) => {
    const colors = [...body.matchAll(/fill: (#[0-9a-f]+)/gi)].map((match) => match[1].toLowerCase());
    return colors.length === 9 && new Set(colors).size === 1 ? [{ face, color: colors[0] }] : [];
  });
  console.log(JSON.stringify({ stage: index + 1, uniformCenters }));
}
