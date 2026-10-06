/** Top-level arguments of the call whose "(" is at `open`, or null if unbalanced. */
// ponytail: tracks quotes/brackets only; regex literals and comments containing brackets can confuse it.
export function callArgs(src: string, open: number): string[] | null {
  const args: string[] = [];
  let depth = 0;
  let quote = "";
  let start = open + 1;
  for (let i = open; i < src.length; i++) {
    const c = src[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      if (--depth === 0) {
        args.push(src.slice(start, i).trim());
        return args;
      }
    } else if (c === "," && depth === 1) {
      args.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  return null;
}

export const lineOf = (src: string, index: number): number => src.slice(0, index).split("\n").length;
