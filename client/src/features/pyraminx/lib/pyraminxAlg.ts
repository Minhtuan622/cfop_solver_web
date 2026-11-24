export function invertPyraminxAlgorithm(text: string): string {
  const tokens = text
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const invertToken = (raw: string): string => {
    const doublePrime = /^([RLUBrlubxyz])2'$/.exec(raw);
    if (doublePrime) return `${doublePrime[1]}2`;
    const double = /^([RLUBrlubxyz])2$/.exec(raw);
    if (double) return double[1];
    if (raw.endsWith("'")) return raw.slice(0, -1);
    return `${raw}'`;
  };
  return tokens.reverse().map(invertToken).join(" ");
}
