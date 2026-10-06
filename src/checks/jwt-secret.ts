import { callArgs, lineOf } from "../core/call-args.js";
import type { Check, Finding } from "../core/types.js";

const JWT_CALL = /\bjwt\.(?:sign|verify)\(/g;
const LITERAL = /^(?:"[^"]*"|'[^']*'|`[^`$]*`)$/;
const ENV_FALLBACK = /process\.env\.\w*(?:JWT|TOKEN|SECRET)\w*\s*(?:\|\||\?\?)\s*["'`][^"'`]*["'`]/i;

// ponytail: only `jwt.` calls with a literal 2nd arg and env fallbacks to a literal; a weak value
// loaded from .env or assigned to a variable first is not judged (the secrets check covers some of these).
export const jwtSecret: Check = {
  id: "jwt-secret",
  title: "Weak JWT secret",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      const src = await project.read(file);
      for (const m of src.matchAll(JWT_CALL)) {
        const secret = callArgs(src, m.index + m[0].length - 1)?.[1];
        if (secret && LITERAL.test(secret))
          findings.push({ checkId: "jwt-secret", severity: "fail", message: "JWT signed/verified with a hardcoded secret; anyone with the source can forge tokens", file, line: lineOf(src, m.index) });
      }
      src.split("\n").forEach((text, i) => {
        if (ENV_FALLBACK.test(text))
          findings.push({ checkId: "jwt-secret", severity: "fail", message: "Secret falls back to a hardcoded default when the env var is missing; a misconfigured deploy silently uses a guessable secret", file, line: i + 1 });
      });
    }
    return findings;
  },
};
