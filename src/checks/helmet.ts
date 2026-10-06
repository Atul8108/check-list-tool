import type { Check } from "../core/types.js";

const EXPRESS = /from\s+["']express["']|require\(\s*["']express["']\s*\)/;
const HELMET = /(?:from\s+|require\(\s*)["'](?:helmet|koa-helmet|fastify-helmet|@fastify\/helmet|lusca)["']/;

// ponytail: only detects that no header middleware is imported, not whether it is mounted before the routes.
export const helmet: Check = {
  id: "helmet",
  title: "No security headers",
  async run(project) {
    let hasExpress = false;
    for (const file of project.files) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      const src = await project.read(file);
      if (HELMET.test(src)) return [];
      if (EXPRESS.test(src)) hasExpress = true;
    }
    return hasExpress
      ? [{ checkId: "helmet", severity: "review", message: "Express app never uses helmet; responses ship without standard security headers (CSP, HSTS, X-Content-Type-Options)" }]
      : [];
  },
};
