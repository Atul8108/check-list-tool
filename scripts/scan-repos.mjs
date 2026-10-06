// Usage: npm run build && node scripts/scan-repos.mjs repos.txt
// repos.txt: one "owner/repo" per line, # for comments. Downloads tarballs (no git needed).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../dist/index.js";

const list = readFileSync(process.argv[2] ?? "repos.txt", "utf8")
  .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const work = mkdtempSync(join(tmpdir(), "ship-scan-"));
const results = [];

// MERN-ish = a package.json (root or one dir deep, e.g. server/) that mentions express.
// ponytail: substring match on package.json text; misses monorepos nested deeper
function usesExpress(dir) {
  const dirs = [dir, ...readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "node_modules" && d.name !== ".git").map((d) => join(dir, d.name))];
  return dirs.some((d) => existsSync(join(d, "package.json")) && /express/.test(readFileSync(join(d, "package.json"), "utf8")));
}

async function scan(repo) {
  const res = await fetch(`https://codeload.github.com/${repo}/tar.gz/HEAD`);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const dir = join(work, repo.replace("/", "__"));
  mkdirSync(dir);
  const tgz = join(dir, "r.tgz");
  writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
  // relative paths: GNU tar reads "C:..." as a remote host
  execFileSync("tar", ["-xzf", "r.tgz", "--strip-components=1"], { cwd: dir });
  rmSync(tgz);
  // ponytail: 3 at a time, no rate-limit handling; codeload is unauthenticated and generous
  if (!usesExpress(dir)) return null;
  return runChecks(dir);
}

const queue = [...list];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    for (let repo; (repo = queue.shift()); ) {
      try {
        const findings = await scan(repo);
        if (!findings) {
          results.push({ repo, skipped: "no express in package.json" });
          console.log(`skip ${repo} (not express-based)`);
        } else {
          results.push({ repo, findings });
          console.log(`ok   ${repo} (${findings.length} findings)`);
        }
      } catch (e) {
        results.push({ repo, error: String(e.message) });
        console.log(`FAIL ${repo}: ${e.message}`);
      }
    }
  }),
);
rmSync(work, { recursive: true, force: true });

mkdirSync("scan-results", { recursive: true });
writeFileSync("scan-results/results.json", JSON.stringify(results, null, 2));

const ok = results.filter((r) => r.findings);
const skipped = results.filter((r) => r.skipped).length;
const failed = results.filter((r) => r.error).length;
const byCheck = {};
const bySeverity = {};
for (const { findings } of ok) {
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
  for (const id of new Set(findings.map((f) => f.checkId))) byCheck[id] = (byCheck[id] ?? 0) + 1;
}
// percentages are over scanned (express-based) repos only; skipped/failed are excluded
const summary = {
  generatedAt: new Date().toISOString(),
  repos: { total: results.length, scanned: ok.length, skipped, failed },
  reposWithCheck: Object.fromEntries(Object.entries(byCheck).sort((a, b) => b[1] - a[1])),
  percentOfScanned: Object.fromEntries(Object.entries(byCheck).map(([id, n]) => [id, ok.length ? Math.round((1000 * n) / ok.length) / 10 : 0])),
  findingsBySeverity: bySeverity,
};
writeFileSync("scan-results/summary.json", JSON.stringify(summary, null, 2));
console.log(`
Scanned ${ok.length}, skipped ${skipped}, failed ${failed} (of ${results.length})`);
for (const [id, n] of Object.entries(summary.reposWithCheck))
  console.log(`${id.padEnd(20)} ${n} repos (${summary.percentOfScanned[id]}%)`);
console.log("Details: scan-results/results.json, scan-results/summary.json");
