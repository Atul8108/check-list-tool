import { callArgs, lineOf } from "../core/call-args.js";
import type { Check, Finding } from "../core/types.js";

const LOOKUP = /\.(findById(?:AndUpdate|AndDelete|AndRemove)?|findOne)\(/g;
const FROM_PARAMS = /\breq\.params\b/;
const OWNER = /owner|user|createdBy|author/i;
const CHECKED_AFTER = /req\.(?:user|auth)\b|res\.locals\.user/;

// ponytail: review only. Ownership bugs (IDOR) are not reliably detectable statically: this flags
// id lookups straight from req.params with no owner hint in the call or the next 5 lines. Lookups
// via helpers, services or non-`req.params` ids are invisible, and an owner hint does not prove a correct check.
export const mongooseOwnership: Check = {
  id: "mongoose-ownership",
  title: "Lookup by id without owner filter",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      const src = await project.read(file);
      for (const m of src.matchAll(LOOKUP)) {
        const args = callArgs(src, m.index + m[0].length - 1);
        if (!args) continue;
        const idArg = m[1] === "findOne" ? /^\{\s*_id\s*:/.test(args[0]!) : true;
        if (!idArg || !FROM_PARAMS.test(args[0]!) || OWNER.test(args.join(","))) continue;
        const line = lineOf(src, m.index);
        const next = src.split("\n").slice(line - 1, line + 5).join("\n");
        if (CHECKED_AFTER.test(next)) continue;
        findings.push({
          checkId: "mongoose-ownership",
          severity: "review",
          message: `${m[1]}(req.params...) with no visible owner check; confirm users cannot read or change each other's records (static analysis cannot verify this)`,
          file,
          line,
        });
      }
    }
    return findings;
  },
};
