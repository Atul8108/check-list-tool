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

const only = async (name: string, id: string) => (await scan(name)).filter((x) => x.checkId === id);

test("flags express app without helmet", async () => {
  expect(await only("helmet-missing", "helmet")).toEqual([expect.objectContaining({ severity: "review" })]);
});

test("flags wildcard cors: fail with credentials, review otherwise", async () => {
  const f = await only("cors-wild", "cors");
  expect(f.map((x) => [x.severity, x.line])).toEqual([["fail", 2], ["review", 4], ["review", 8]]);
});

test("flags hardcoded jwt secret and env fallback", async () => {
  const f = await only("jwt-weak", "jwt-secret");
  expect(f.map((x) => [x.severity, x.line])).toEqual([["fail", 2], ["fail", 3]]);
});

test("flags unowned id lookups as review", async () => {
  const f = await only("owner-missing", "mongoose-ownership");
  expect(f.map((x) => [x.severity, x.line])).toEqual([["review", 2], ["review", 5]]);
});

test("flags req.body/req.query passed into queries", async () => {
  const f = await only("nosql-direct", "nosql-injection");
  expect(f.map((x) => x.line)).toEqual([2, 3]);
});

test("safe MERN equivalents are not flagged", async () => {
  expect(await scan("safe-mern")).toEqual([]);
});

test("clean project has no findings", async () => {
  expect(await scan("clean")).toEqual([]);
});

test("ignores placeholder secrets in .env.example", async () => {
  expect(await scan("env-example")).toEqual([]);
});

test("signin route is treated as public", async () => {
  expect(ids(await scan("nosql-direct"))).not.toContain("auth-routes");
});

test("lusca counts as security-header middleware", async () => {
  expect(ids(await scan("lusca-headers"))).not.toContain("helmet");
});
