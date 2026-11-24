export function toCubingNotation(alg: string): string {
  return alg.replace(/[()]/g, " ").split(/\s+/).filter(Boolean).join(" ");
}

export function invertFiveByFiveL2EAlgorithm(alg: string): string {
  return toCubingNotation(alg)
    .split(" ")
    .reverse()
    .map(token => {
      if (token.endsWith("2")) return token;
      return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
    })
    .join(" ");
}

export function fiveByFiveL2EScrambleOf(alg: string): string {
  return invertFiveByFiveL2EAlgorithm(alg);
}
