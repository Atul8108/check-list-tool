import { allChecks } from "../checks/index.js";
import { loadProject } from "./project.js";
import type { Check, Finding } from "./types.js";

export async function runChecks(root: string, checks: Check[] = allChecks): Promise<Finding[]> {
  const project = await loadProject(root);
  const results = await Promise.all(checks.map((c) => c.run(project)));
  return results.flat();
}
