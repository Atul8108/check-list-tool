import type { Check } from "../core/types.js";

const LIMITER = /express-rate-limit|rate-limiter-flexible|express-slow-down|@upstash\/ratelimit|@fastify\/rate-limit/;
const EXPRESS = /from\s+["']express["']|require\(\s*["']express["']\s*\)/;

// ponytail: only detects that no limiter exists, not whether it covers the right routes.
export const rateLimit: Check = {
  id: "rate-limit",
  title: "No rate limiting",
  async run(project) {
    let hasExpress = false;
    for (const file of project.files) {
      const src = await project.read(file);
      if (LIMITER.test(src)) return [];
      if (EXPRESS.test(src)) hasExpress = true;
    }
    return hasExpress
      ? [{ checkId: "rate-limit", severity: "fail", message: "Express app with no rate limiter (e.g. express-rate-limit); login and API routes are open to brute force and DoS" }]
      : [];
  },
};
