import { resolve } from "node:path";
import { expect, test } from "vitest";
import { runChecks } from "../src/index.js";

test("flags hardcoded secret in fixture", async () => {
  const findings = await runChecks(resolve(__dirname, "fixtures/leaky"));
  expect(findings).toContainEqual(
    expect.objectContaining({ checkId: "secrets", severity: "fail", file: "server.js", line: 1 }),
  );
});
