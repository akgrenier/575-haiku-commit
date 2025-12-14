# Learning Guides (Build a VS Code extension like this)

This repo is a working, shippable VS Code extension *and* a blueprint for building your own. The learning guides are about **how to create VS Code extensions**, using this project as the concrete example.

Guides live under `docs/guides/`.
Each guide is written to be used **with this repo open**: it points at the exact files, command ids, and settings keys so you can follow along and replicate the patterns.

## Start here

- **Guide 00 — Template this repo into your VS Code extension:** [`docs/guides/00-template-this-repo.md`](./guides/00-template-this-repo.md)
- **Guide 01 — Extension anatomy (this repo as a blueprint):** [`docs/guides/01-extension-anatomy.md`](./guides/01-extension-anatomy.md)
- **Guide 02 — Commands end-to-end (manifest → activation → handler):** [`docs/guides/02-commands-end-to-end.md`](./guides/02-commands-end-to-end.md)
- **Guide 03 — Settings + SecretStorage (keys done right):** [`docs/guides/03-settings-and-secretstorage.md`](./guides/03-settings-and-secretstorage.md)
- **Guide 04 — SCM integration end-to-end (commit box + SCM toolbar):** [`docs/guides/04-scm-integration.md`](./guides/04-scm-integration.md)
- **Guide 05 — Provider architecture (registry + retries + error mapping):** [`docs/guides/05-provider-architecture.md`](./guides/05-provider-architecture.md)
- **Guide 06 — Prompt + validation (constraints + tests):** [`docs/guides/06-prompt-and-validation.md`](./guides/06-prompt-and-validation.md)

## Roadmap topics

Future topics (not yet written):

- **Diagnostics end-to-end:** Output channel patterns, debug flags, safe redaction rules, and building “repro steps” UX into your extension.
- **Release discipline:** `vsce` packaging, `.vsix` hygiene, Marketplace listing basics, tags/releases, and a repeatable release checklist (with automation-friendly preflight steps).
- **Testing & CI-ish checks:** smoke tests, validation scripts, and “preflight” commands you can run before cutting a release (without a full test framework).
- **UX polish patterns:** status bar affordances, QuickPick flows, cancellation, error UX that teaches users what to do next.
- **Refactors for scale:** extracting `settings.ts`, `commands/`, shared retry helpers, and “thin `extension.ts`” patterns once your repo grows past one feature.

## Contributing a guide

If you want to kick-start a guide:

1. Open an issue tagged `learning`
2. Sketch the outline (the steps + screenshots you think we need)
3. We’ll pair up on structure and polish


