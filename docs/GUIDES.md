# Learning Guides (Build a VS Code extension like this)

This repo is a working, shippable VS Code extension *and* a blueprint for building your own. The learning guides are about **how to create VS Code extensions**, using this project as the concrete example.

Guides live under `docs/guides/`.
Each guide is written to be used **with this repo open**: it points at the exact files, command ids, and settings keys so you can follow along and replicate the patterns.

## Start here

- **Guide 01 — Extension anatomy (this repo as a blueprint):** [`docs/guides/01-extension-anatomy.md`](./guides/01-extension-anatomy.md)
- **Guide 02 — Commands end-to-end (manifest → activation → handler):** [`docs/guides/02-commands-end-to-end.md`](./guides/02-commands-end-to-end.md)
- **Guide 03 — Settings + SecretStorage (keys done right):** [`docs/guides/03-settings-and-secretstorage.md`](./guides/03-settings-and-secretstorage.md)
- **Guide 04 — SCM integration end-to-end (commit box + SCM toolbar):** [`docs/guides/04-scm-integration.md`](./guides/04-scm-integration.md)
- **Guide 05 — Provider architecture (registry + retries + error mapping):** [`docs/guides/05-provider-architecture.md`](./guides/05-provider-architecture.md)
- **Guide 06 — Prompt + validation (constraints + tests):** [`docs/guides/06-prompt-and-validation.md`](./guides/06-prompt-and-validation.md)

## Roadmap topics

Planned topics:

- **Extension anatomy (hello, real world):** activation events, `package.json` contributions, `src/extension.ts`, and the build output in `out/`.
- **Commands end-to-end:** Command Palette commands, keybindings, and wiring UX from `package.json` → `registerCommand` → implementation.
- **Source Control integration:** writing into the SCM input box, adding SCM toolbar buttons, and UX patterns that don’t feel janky.
- **Settings + UX:** configuration schema, defaults, migration/precedence rules, and when to prompt vs when to silently fall back.
- **Secrets done right:** API keys in VS Code Settings/SecretStorage, safe prompts, and how to avoid leaking keys into logs/issues.
- **Provider architecture:** a clean provider registry (Anthropic/OpenAI/Gemini as examples), request/response shaping, retries, and error mapping.
- **Prompts + output validation:** enforcing constraints (like strict 5‑7‑5), corrective retries, and how to test deterministic validators.
- **Logging/diagnostics that help:** output channels, debug flags, and what to include in bug reports so maintainers can actually reproduce.
- **Packaging & publishing:** `vsce`, `.vsix` hygiene, Marketplace listing basics, tags/releases, and a repeatable release checklist.
- **Testing & CI-ish checks:** smoke tests, validation scripts, and “preflight” commands you can run before cutting a release.

## Contributing a guide

If you want to kick-start a guide:

1. Open an issue tagged `learning`
2. Sketch the outline (the steps + screenshots you think we need)
3. We’ll pair up on structure and polish


