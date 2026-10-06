import type { Reporter } from "../core/types.js";

export const textReporter: Reporter = (findings) => {
  if (!findings.length) return "No findings.";
  return findings
    .map((f) => `[${f.severity}] ${f.checkId}: ${f.message}${f.file ? ` (${f.file}${f.line ? `:${f.line}` : ""})` : ""}`)
    .join("\n");
};
