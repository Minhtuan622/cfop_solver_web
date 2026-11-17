/**
 * Square-1 algorithm helpers.
 *
 * The stored algorithms use standard parenthesized notation
 * "(x,y) / (x,y)" — cubing.js parses that format, but NOT the bare "x,y"
 * token format. Rotation amounts are 30° units; a pair's inverse negates
 * both amounts and the swap move "/" is self-inverse, so the inverse is
 * exactly the reverse of the pairs with each pair negated. `String(-0)`
 * yields "0", so sign output stays normalized.
 */
export function invertSquareOneAlgorithm(text: string): string {
  const tokens = text.split(/\s+/).filter(Boolean);
  const invertToken = (raw: string): string => {
    if (raw === "/") return "/";
    const pair = /^\((-?\d+),(-?\d+)\)$/.exec(raw);
    if (!pair) throw new Error(`Unsupported Square-1 move: ${raw}`);
    return `(${String(-Number(pair[1]))},${String(-Number(pair[2]))})`;
  };
  return tokens.reverse().map(invertToken).join(" ");
}
