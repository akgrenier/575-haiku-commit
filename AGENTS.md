# AGENTS Guidelines for This Repository

This is a VS Code extension written in TypeScript. Source lives in `src/` and compiled JavaScript is emitted to `out/`.

This file is a dedicated guide for coding agents. It follows community conventions from the AGENTS.md project so agents can work predictably without reading the full README first. See: https://agents.md/

## Project Overview (for agents)

- Purpose: generate 5‑7‑5 haiku commit messages from the staged git diff.
- Entry point: `src/extension.ts` → compiled to `out/extension.js`.
- Build system: TypeScript (`tsc`). `pnpm run dev` runs `tsc --watch`.
- Runtime host: VS Code Extension Development Host (launch with `F5`).
- Do not modify files under `out/` directly. They are generated.

## Default Agent Flow

1. `pnpm install`
2. `pnpm run dev` (keeps TypeScript build hot; emits to `out/`)
3. `pnpm run test:validate` (lightweight runtime checks)
4. Press `F5` in VS Code to launch the Extension Development Host
5. Stage a small diff and run the command “Generate Haiku Commit Message”
6. If you edited docs/config/scripts → `pnpm run lint:secrets`

Keep the watcher running while you work. If the output seems stale, stop the watcher, then run `pnpm run compile` once and restart `pnpm run dev`.

## Command Matrix

| Command                   | Purpose                                 | When to use                                         | Notes                                             |
| ------------------------- | --------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| `pnpm install`            | Install dependencies                    | First run; after lockfile changes                   | Keep `pnpm-lock.yaml` in sync                     |
| `pnpm run dev`            | TypeScript watch build                  | Default during development                          | Emits to `out/`; prefer over one‑off builds       |
| `pnpm run compile`        | Clean compile once                      | Before commits/PRs; to reset diagnostics            | Use if watcher gets stuck                         |
| `pnpm run test:validate`  | Smoke tests for haiku validator         | After changes under `src/haiku/` or before releases | Runs `scripts/test-validate.js` non‑interactively |
| `pnpm run lint:secrets`   | Scan for leaked credentials             | After editing docs/config/scripts                   | Blocks accidental `sk-...` style strings          |
| `pnpm run release:verify` | Preflight: secrets + compile + validate | Before PRs/releases                                 | One‑shot CI‑like check                            |
| `pnpm run package`        | Build `.vsix`                           | Only for manual release packaging                   | Do not run during routine agent sessions          |

If new scripts are added, update this matrix and the README command references.

## Rule Precedence (AGENTS.md convention)

- The closest `AGENTS.md` to the edited file wins.
- Explicit user chat instructions override this file when they conflict.
- Generated artifacts (`out/`, `.vsix`) must not be edited.

Reference: https://agents.md/

## IDE Workflow & VS Code Host

- Launch the Extension Development Host via VS Code (`F5`). Avoid spawning multiple hosts.
- Use `pnpm run dev` while iterating; it keeps `out/` synchronized with source changes.
- If the extension appears stale, stop the watcher and run `pnpm run compile` once before restarting the watcher.

## Testing & Validation

Run the smoke validator:

```bash
pnpm run test:validate
```

Expected output includes lines like:

```
OK: normalizeHaiku trims to 3 lines
OK: isStrict575 returns a boolean
OK: isStrict575 false for non-3-line input
validate checks passed
```

If you see stale or missing outputs, run `pnpm run compile` and re‑run the validator.

For manual validation before a PR or release:

1. `pnpm run release:verify`
2. Press `F5` to launch the host and generate at least one haiku against a staged diff
3. Toggle provider/model commands to confirm prompts and status‑bar affordances
4. Capture a short note or GIF if UI changed

## Security & Secrets

- Never commit API keys. Keys are stored in VS Code Settings under:
  - `haikuCommit.anthropicApiKey`
  - `haikuCommit.openaiApiKey`
  - `haikuCommit.geminiApiKey`
- After editing documentation, config, or scripts, run: `pnpm run lint:secrets`.
- When demonstrating in docs, link to provider key pages rather than pasting real values. See README “Setup”.

## File & Module Conventions

- New logic goes in `src/` (providers, git helpers, validation). Re‑export provider hooks from `src/providers/index.ts` for a single import surface.
- Do not edit `out/` directly; rebuild instead.
- Media assets belong in `media/`. Docs and guides belong in `docs/`.

## PR & Release Hygiene

- Prefer small, purposeful commits. Conventional commits or haiku‑style subjects are both acceptable.
- Before opening a PR: `pnpm run release:verify` and include manual validation notes (what you clicked, what you saw).
- Keep generated artifacts out of git: `out/`, `node_modules/`, `.vsix`.

## Troubleshooting Tip Sheet

- Watcher stuck? Stop `pnpm run dev`, run `pnpm run compile` once, then restart `pnpm run dev`.
- Missing types? Ensure `node_modules` exists; run `pnpm install`.
- Secretlint failures? Replace any hard‑coded keys with placeholders and rerun `pnpm run lint:secrets`.

## Agent Config Snippets

- Aider (`.aider.conf.yml`)

```yaml
read: AGENTS.md
```

- Gemini CLI (`.gemini/settings.json`)

```json
{ "contextFileName": "AGENTS.md" }
```

## Do / Don’t Quicklist

- Do use `pnpm run dev` while iterating; keep a single Extension Development Host.
- Do run `pnpm run release:verify` before PRs/releases.
- Don’t run `pnpm run package` during routine development.
- Don’t edit `out/` or commit secrets.

## Cross‑links (human‑oriented docs)

- Development, Validation, Release: see `README.md` → Development, Manual Validation, Release Prep.
- Detailed release checklist: `docs/RELEASE_PREP.md`.

This guide follows AGENTS.md best practices so multiple agent tools can consume it consistently. See: https://agents.md/ and community examples discoverable via: https://github.com/search?q=path:AGENTS.md&type=code
