import { callArgs, lineOf } from "../core/call-args.js";
import type { Check, Finding } from "../core/types.js";

const CORS_IMPORT = /from\s+["']cors["']|require\(\s*["']cors["']\s*\)/;
const CORS_CALL = /(?<![\w.])cors\(/g;
const WILDCARD = /\borigin\s*:\s*(?:["'`]\*["'`]|true)\s*[,}\s]/;
const CREDENTIALS = /\bcredentials\s*:\s*true\b/;

// ponytail: only literal wildcards; an origin function that returns true, or a config held in a variable, is not followed.
export const cors: Check = {
  id: "cors",
  title: "Permissive CORS",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      const src = await project.read(file);
      if (!CORS_IMPORT.test(src)) continue;
      for (const m of src.matchAll(CORS_CALL)) {
        const args = callArgs(src, m.index + m[0].length - 1);
        if (!args) continue;
        const line = lineOf(src, m.index);
        const cfg = args.join(",") + " ";
        if (WILDCARD.test(cfg) && CREDENTIALS.test(cfg))
          findings.push({ checkId: "cors", severity: "fail", message: "CORS allows any origin with credentials: true; any website can make authenticated requests as your users", file, line });
        else if (WILDCARD.test(cfg))
          findings.push({ checkId: "cors", severity: "review", message: "CORS allows any origin; restrict to your frontend's origin unless the API is meant to be public", file, line });
        else if (args.length === 1 && args[0] === "")
          findings.push({ checkId: "cors", severity: "review", message: "cors() with no options allows any origin; pass an explicit origin", file, line });
      }
    }
    return findings;
  },
};
