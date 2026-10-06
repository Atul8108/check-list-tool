# ship-check

Pre-launch checklist runner for vibe-coded MERN apps. Not a security guarantee.

```
npx ship-check [path] [--json]
```

## Layout

```
src/
  cli.ts          arg parsing + exit code only
  index.ts        public API
  core/           types, project loader, runner
  checks/         one file per check; register in checks/index.ts
  reporters/      findings -> string (text, json)
tests/fixtures/   tiny sample projects, one per scenario
```
