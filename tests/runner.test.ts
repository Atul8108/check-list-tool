import { resolve } from "node:path";
import { expect, test } from "vitest";
import { runChecks } from "../src/index.js";

const scan = (name: string) => runChecks(resolve(__dirname, "fixtures", name));
const ids = (f: { checkId: string }[]) => f.map((x) => x.checkId);

test("flags hardcoded secret", async () => {
  expect(await scan("leaky")).toContainEqual(
    expect.objectContaining({ checkId: "secrets", severity: "fail", file: "server.js", line: 1 }),
  );
});

test("flags missing rate limit and unauthenticated routes, skips login and authed routes", async () => {
  const f = await scan("bare-express");
  expect(ids(f)).toContain("rate-limit");
  const auth = f.filter((x) => x.checkId === "auth-routes");
  expect(auth).toHaveLength(1);
  expect(auth[0]!.message).toContain("/api/users");
});

test("flags unsigned webhook and empty catch", async () => {
  const f = (await scan("unsigned-webhook")).filter((x) => x.checkId === "webhook-signature");
  expect(f.map((x) => x.severity).sort()).toEqual(["fail", "review"]);
});

test("clean project has no findings", async () => {
  expect(await scan("clean")).toEqual([]);
});
