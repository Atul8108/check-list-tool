// Publishes the same build to GitHub Packages under the repo owner's scope.
// Usage: npm run publish:github [-- --dry-run]
// Needs ~/.npmrc: //npm.pkg.github.com/:_authToken=<classic PAT with write:packages>
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const original = readFileSync("package.json", "utf8");
const pkg = JSON.parse(original);
pkg.name = "@atul8108/ship-check"; // GitHub requires the scope to match the repo owner
pkg.publishConfig = { registry: "https://npm.pkg.github.com", access: "public" };

writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
try {
  execSync(`npm publish ${process.argv.slice(2).join(" ")}`, { stdio: "inherit" });
} finally {
  writeFileSync("package.json", original); // always restore the npmjs manifest
}
