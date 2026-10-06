#!/usr/bin/env node
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { runChecks } from "./core/runner.js";
import { jsonReporter } from "./reporters/json.js";
import { textReporter } from "./reporters/text.js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { json: { type: "boolean", default: false } },
});

const findings = await runChecks(resolve(positionals[0] ?? "."));
console.log((values.json ? jsonReporter : textReporter)(findings));
process.exitCode = findings.some((f) => f.severity === "fail") ? 1 : 0;
