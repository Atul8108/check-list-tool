import type { Check, Finding } from "../core/types.js";

const ROUTE = /\b(?:app|router)\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]\s*,(.*)/;
const AUTHISH = /auth|protect|verify|jwt|session|passport|requireUser|isLoggedIn|guard/i;
const PUBLIC_PATH = /login|register|signup|health|webhook|public|^\/$/i;

// ponytail: line-based heuristic, misses multi-line route definitions; "review" only, never "fail".
export const authRoutes: Check = {
  id: "auth-routes",
  title: "Routes without auth",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]s$/.test(file)) continue;
      const lines = (await project.read(file)).split("\n");
      // A global/router-level auth middleware in this file covers its routes.
      if (lines.some((l) => /\.use\(.*(auth|protect|verify|jwt|session|passport)/i.test(l))) continue;
      lines.forEach((text, i) => {
        const m = ROUTE.exec(text);
        if (!m || PUBLIC_PATH.test(m[2]!) || AUTHISH.test(m[3]!)) return;
        findings.push({
          checkId: "auth-routes",
          severity: "review",
          message: `${m[1]!.toUpperCase()} ${m[2]} has no visible auth middleware`,
          file,
          line: i + 1,
        });
      });
    }
    return findings;
  },
};
