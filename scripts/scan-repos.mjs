// Usage: npm run build && node scripts/scan-repos.mjs repos.txt
// repos.txt: one "owner/repo" per line, # for comments. Downloads tarballs (no git needed).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runChecks } from "../dist/index.js";

const list = readFileSync(process.argv[2] ?? "repos.txt", "utf8")
  .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const work = mkdtempSync(join(tmpdir(), "ship-scan-"));
const results = [];

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
  return runChecks(dir);
}

const queue = [...list];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    for (let repo; (repo = queue.shift()); ) {
      try {
        const findings = await scan(repo);
        results.push({ repo, findings });
        console.log(`ok   ${repo} (${findings.length} findings)`);
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
const byCheck = {};
for (const { repo, findings } of ok)
  for (const id of new Set(findings.map((f) => f.checkId))) (byCheck[id] ??= []).push(repo);
console.log(`\nScanned ${ok.length}/${results.length} repos`);
for (const [id, repos] of Object.entries(byCheck).sort((a, b) => b[1].length - a[1].length))
  console.log(`${id.padEnd(20)} ${repos.length} repos (${Math.round((100 * repos.length) / ok.length)}%)`);
console.log("Details: scan-results/results.json");
