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
