import type { Check } from "../core/types.js";

const MAX_LINES = 500;

export const fileSize: Check = {
  id: "file-size",
  title: `Files over ${MAX_LINES} lines`,
  async run(project) {
    const findings = [];
    for (const file of project.files) {
      const lines = (await project.read(file)).split("\n").length;
      if (lines > MAX_LINES)
        findings.push({
          checkId: "file-size",
          severity: "info" as const,
          message: `${lines} lines; likely AI-generated blob, split it`,
          file,
        });
    }
    return findings;
  },
};
