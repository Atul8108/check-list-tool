# ship-check

[![npm version](https://img.shields.io/npm/v/@atul-shaw/ship-check.svg)](https://www.npmjs.com/package/@atul-shaw/ship-check)
[![license](https://img.shields.io/npm/l/@atul-shaw/ship-check?label=license)](LICENSE)
[![node](https://img.shields.io/node/v/@atul-shaw/ship-check.svg)](package.json)

A pre-launch checklist runner for AI-generated ("vibe-coded") MERN apps. It scans your source for the mistakes AI tools ship most often: hardcoded secrets, no rate limiting, unprotected routes and unsigned payment webhooks.

> **ship-check is a checklist, not a security guarantee.** It is static analysis. It cannot find ownership bugs (IDOR) or business-logic flaws. Treat a clean run as "the obvious things are covered", not "this app is secure".

## Install

```sh
npm install --save-dev @atul-shaw/ship-check
```

Or run it without installing:

```sh
npx @atul-shaw/ship-check
```

Requires Node.js 20 or later.

## Usage

```sh
npx @atul-shaw/ship-check [path] [--json]
```

| Argument | Description |
|---|---|
| `path` | Project directory to scan. Defaults to the current directory. |
| `--json` | Print findings as JSON instead of text. |

Example output:

```
[fail] secrets: Hardcoded secret (server.js:1)
[fail] rate-limit: Express app with no rate limiter (e.g. express-rate-limit); login and API routes are open to brute force and DoS
[review] auth-routes: GET /api/users has no visible auth middleware (server.js:3)
```

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No `fail` findings (`review` and `info` do not fail the run). |
| `1` | At least one `fail` finding. |

Use it in CI:

```yaml
- run: npx @atul-shaw/ship-check
```

## Checks

| ID | Severity | What it looks for |
|---|---|---|
| `secrets` | fail | API keys, private keys, hardcoded JWT/API secrets, secrets in `NEXT_PUBLIC_` / `VITE_` / `REACT_APP_` variables. |
| `rate-limit` | fail | An Express app with no rate-limiting package anywhere in the project. |
| `auth-routes` | review | Express routes with no visible auth middleware. Login, register, health and webhook routes are skipped. |
| `webhook-signature` | fail / review | Stripe or Razorpay webhook handlers that never verify the signature, and empty `catch` blocks in payment code. |
| `helmet` | review | An Express app where `helmet` is never imported. |
| `cors` | fail / review | `cors()` with `origin: "*"` or `origin: true`: fail with `credentials: true`, review otherwise or with no options. |
| `jwt-secret` | fail | `jwt.sign` / `jwt.verify` with a string-literal secret, or `process.env.X \|\| "literal"` fallbacks. |
| `mongoose-ownership` | review | `findById*(req.params...)` / `findOne({ _id: req.params... })` with no owner hint nearby. |
| `nosql-injection` | review | `req.body` / `req.query` passed directly into `find`, `findOne`, `updateOne`, `deleteOne` and similar. |
| `file-size` | info | Files over 500 lines. |

Scanned: `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.json` and `.env*` files. Ignored: `node_modules`, `.git`, `dist`, `build`, `coverage`, `.next`.

### Known limits

- `rate-limit` detects that no limiter exists, not whether it covers the right routes.
- `auth-routes` is a line-based heuristic and misses routes defined across several lines. It only ever reports `review`.
- `helmet` only checks that it is imported, not that it is mounted before your routes.
- `cors` only sees literal wildcards, not an origin function that returns `true` or a config held in a variable.
- `jwt-secret` does not judge weak values loaded from `.env` or assigned to a variable first.
- `mongoose-ownership` is a prompt to check, never proof: ownership bugs (IDOR) cannot be reliably found statically. It only sees `req.params` ids passed straight into the lookup.
- `nosql-injection` only flags the direct `find(req.body)` form, not field access like `{ email: req.body.email }`.
- `webhook-signature` does not check idempotency or subscription-state handling.

## Programmatic API

```js
import { runChecks } from "@atul-shaw/ship-check";

const findings = await runChecks("./my-app");
// [{ checkId, severity: "fail" | "review" | "info", message, file?, line? }]
```

Exports: `runChecks`, `allChecks`, and the types `Check`, `Finding`, `Project`, `Reporter`, `Severity`.

## Running a study

```sh
npm run build
npm run find-repos -- --limit 100      # writes repos.txt (try --dry-run first; edit QUERIES in scripts/find-repos.mjs)
npm run scan -- repos.txt              # writes scan-results/results.json and summary.json
```

Set `GITHUB_TOKEN` to raise the GitHub search rate limit (unauthenticated is about 10 requests a minute). Repos without Express in a `package.json` are reported as `skipped` and excluded from the percentages.

Results are heuristic: the discovery queries only find repos that mention AI builders, which is not proof they were AI-generated, and the checks are static analysis. Publish aggregated numbers (`summary.json`), not individual repos.

## Contributing

```sh
npm install
npm test          # vitest
npm run typecheck
npm run build
```

To add a check, create `src/checks/<id>.ts` exporting a `Check`, register it in `src/checks/index.ts`, and add a fixture under `tests/fixtures/` with a test.

```
src/
  cli.ts          argument parsing and exit code
  index.ts        public API
  core/           types, project loader, runner
  checks/         one file per check
  reporters/      findings -> string (text, json)
tests/fixtures/   small sample projects, one per scenario
```

## License

[MIT](LICENSE)
