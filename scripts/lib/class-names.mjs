export function matchBrace(source, start) {
  let i = start + 1;
  let depth = 1;
  while (i < source.length) {
    const char = source[i];
    if (char === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i;
      i += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    if (char === "`") {
      i += 1;
      while (i < source.length && source[i] !== "`") {
        if (source[i] === "\\") i += 1;
        i += 1;
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  return -1;
}

function enclosingCall(expression, index) {
  let i = index - 1;
  while (i >= 0 && /\s/.test(expression[i])) i -= 1;
  if (i < 0 || expression[i] !== "(") return null;
  i -= 1;
  const end = i;
  while (i >= 0 && /[\w$]/.test(expression[i])) i -= 1;
  if (i === end) return null;
  return expression.slice(i + 1, end + 1);
}

const CLASS_HELPERS = new Set(["cn", "clsx", "cx", "classNames"]);

export function extractLiterals(expression) {
  const literals = [];
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];
    if (char === "/" && expression[i + 1] === "/") {
      const end = expression.indexOf("\n", i);
      i = end < 0 ? expression.length : end;
      continue;
    }
    if (char === "/" && expression[i + 1] === "*") {
      const end = expression.indexOf("*/", i + 2);
      i = end < 0 ? expression.length : end + 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      const before = expression.slice(0, i).replace(/\s+$/, "");
      const isComparison = /(===|!==|==|!=)$/.test(before);
      const call = enclosingCall(expression, i);
      let j = i + 1;
      let text = "";
      while (j < expression.length && expression[j] !== quote) {
        if (expression[j] === "\\") j += 1;
        text += expression[j];
        j += 1;
      }
      if (!isComparison && (!call || CLASS_HELPERS.has(call))) literals.push(text);
      i = j + 1;
      continue;
    }
    if (char === "`") {
      const call = enclosingCall(expression, i);
      let j = i + 1;
      let text = "";
      while (j < expression.length && expression[j] !== "`") {
        if (expression[j] === "\\") {
          j += 1;
          text += expression[j];
          j += 1;
          continue;
        }
        if (expression[j] === "$" && expression[j + 1] === "{") {
          const end = matchBrace(expression, j + 1);
          if (end < 0) break;
          j = end + 1;
          text += " ";
          continue;
        }
        text += expression[j];
        j += 1;
      }
      if (!call || CLASS_HELPERS.has(call)) literals.push(text);
      i = j + 1;
      continue;
    }
    i += 1;
  }
  return literals;
}

export function classNamesOf(source) {
  const literals = [];
  for (const match of source.matchAll(/className\s*=\s*/g)) {
    let i = match.index + match[0].length;
    const char = source[i];
    if (char === '"' || char === "'") {
      const quote = char;
      i += 1;
      let text = "";
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\") i += 1;
        text += source[i];
        i += 1;
      }
      literals.push(text);
      continue;
    }
    if (char === "{") {
      const end = matchBrace(source, i);
      if (end < 0) continue;
      literals.push(...extractLiterals(source.slice(i + 1, end)));
    }
  }
  return literals;
}

export function baseName(name) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const char of name) {
    if (char === "[" || char === "(") depth += 1;
    if (char === "]" || char === ")") depth -= 1;
    if (char === ":" && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts[parts.length - 1] || name;
}
