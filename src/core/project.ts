import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Project } from "./types.js";

const IGNORED = /(^|\/)(node_modules|\.git|dist|build|coverage|\.next)\//;
const SOURCE = /\.(?:[cm]?[jt]sx?|env[^/]*|json)$/;

export async function loadProject(root: string): Promise<Project> {
  const all = await readdir(root, { recursive: true, withFileTypes: true });
  const files = all
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name).slice(root.length + 1).replaceAll("\\", "/"))
    .filter((f) => !IGNORED.test(f + "/") && SOURCE.test(f));
  return { root, files, read: (f) => readFile(join(root, f), "utf8") };
}
