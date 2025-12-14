# Development

This page is for contributors and maintainers. If you just want to *use* the extension, start at the repo root [`README.md`](../README.md).

## Quick start (local dev)

1. Clone the repo
2. Install deps:

```bash
pnpm install
```

3. Open the repo in VS Code
4. Build (one of):
   - Watch build (recommended while iterating):

```bash
pnpm run dev
```

   - One-off compile:

```bash
pnpm run compile
```

5. Press `F5` to launch the Extension Development Host
6. Stage a small diff in a git repo and run **“Generate Haiku Commit Message”**

> For coding agents: follow the streamlined workflow in [`AGENTS.md`](../AGENTS.md) (watch build, validation, and release preflight steps).

## Manual Validation (smoke test)

Run this quick smoke test before publishing, cutting a release tag, or after touching provider/prompt/validation logic:

1. Run:

```bash
pnpm run release:verify
```

This runs secret scanning, rebuilds `out/`, and executes `scripts/test-validate.js`.

2. Launch the Extension Development Host (`F5`) and generate at least one haiku against a staged diff.
3. Toggle each provider command to confirm prompts and status-bar affordances behave:
   - **Haiku Commit: Set API Key**
   - **Haiku Commit: Set Provider**
   - **Haiku Commit: Set Model**
4. If UI changed, capture a screenshot or short GIF and stash it under [`media/`](../media/).

Document your manual steps in the PR or release notes so reviewers can replay them.

## Logging & Diagnostics

- Default runs are quiet. The output channel stays silent unless you opt in.
- Enable verbose logs via `haikuCommit.debug`, or run **“Haiku Commit: Show Logs”** to surface the output channel.
- When filing a bug, include: provider, model, `strict575` value, and whether generation hit retries.

## Packaging & publishing

This is maintainer-only territory. Use the checklist in [`docs/RELEASE_PREP.md`](./RELEASE_PREP.md).


