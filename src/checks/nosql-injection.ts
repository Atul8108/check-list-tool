import type { Check, Finding } from "../core/types.js";

const DIRECT = /\.(?:find|findOne|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate|findOneAndDelete|countDocuments|replaceOne)\(\s*req\.(?:body|query)\s*[,)]/;

// ponytail: only the direct pass-through form `find(req.body)`. Field access like
// `{ email: req.body.email }` is not flagged (needs type tracking to avoid noise), nor are spreads or aliased variables.
export const nosqlInjection: Check = {
  id: "nosql-injection",
  title: "Request body used as Mongo query",
  async run(project) {
    const findings: Finding[] = [];
    for (const file of project.files) {
      if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
      (await project.read(file)).split("\n").forEach((text, i) => {
        if (DIRECT.test(text))
          findings.push({ checkId: "nosql-injection", severity: "review", message: "req.body/req.query passed straight into a Mongo query; operators like {\"$ne\": null} let attackers bypass filters. Pick and String() the fields you need", file, line: i + 1 });
      });
    }
    return findings;
  },
};
