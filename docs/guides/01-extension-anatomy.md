# Guide 01 — Extension anatomy (this repo as a blueprint)

This guide explains how a VS Code extension is put together **in this repo**, so you can copy the shape and swap in your own feature.

## What you’re building (high level)

- **A VS Code extension** written in TypeScript (`src/`)
- **Compiled JS output** emitted to `out/` (generated — don’t edit by hand)
- **VS Code wiring** defined in `package.json` (commands, keybindings, settings, activation)

If you can find these three pieces in any extension repo, you can usually understand it fast.

## Repo map (what matters, what’s noise)

### The “must understand” files

- `package.json`
  - Declares the extension manifest (publisher/name/version)
  - Declares **contributions** (commands, configuration/settings, keybindings, menus)
  - Declares **activation events** (when VS Code loads your extension)
  - Points VS Code at the compiled entrypoint (typically `out/extension.js`)
- `src/extension.ts`
  - The runtime entrypoint (the `activate()` function)
  - Registers commands and connects them to implementation
  - Owns lifecycle/disposal of resources
- `tsconfig.json`
  - Controls compilation from `src/` → `out/`

### Core implementation folders (this repo’s shape)

- `src/git/`: reading the staged diff (your extension will have its own “input source” layer)
- `src/providers/`: provider registry + provider implementations (a pattern worth stealing)
- `src/prompt/`: prompt assembly / prompt templates (your “business logic glue” can live here)
- `src/haiku/`: validation and normalization (domain rules + deterministic tests)
- `src/http/`: fetch wrappers and retry/backoff primitives
- `src/logging.ts`: output channel + debug logging patterns

### Generated artifacts

- `out/`: compiled output from TypeScript
  - **Do not edit**; always change `src/` and rebuild.

## How VS Code loads this extension

VS Code loads extensions based on **activation events** and the manifest’s entrypoint.

In practice:

1. VS Code sees an activation event is satisfied (e.g., a command is invoked)
2. VS Code loads the extension entrypoint (compiled JS under `out/`)
3. VS Code calls your `activate(context)` function
4. Your code registers commands and any UI integrations

Your mental model should be: **nothing runs until activation**, and **activation should stay fast**.

## How commands are wired (the “manifest → code” pipeline)

Most extensions are just:

1. Define a command in `package.json` (id + title)
2. Register that command id in `activate()` via `vscode.commands.registerCommand(...)`
3. Implement the handler

When debugging “why doesn’t my command show up?”:

- Check the command exists under `contributes.commands`
- Check activation events include `onCommand:<your.command.id>` (or some other event that loads your extension)
- Check your `activate()` registered the command id you think it did

## Settings (configuration) as a product surface

Settings are your extension’s API.

In this repo, the settings cover:

- Provider selection
- API keys
- Model selection / precedence
- Strict validation behavior
- Retry/token limits
- Debug logging

Key design principle you should copy: **defaults should work**, and **prompts should appear only when needed**.

## Build + run loop (fast iteration)

This repo’s recommended loop:

1. `pnpm install`
2. `pnpm run dev` (watch build; keeps `out/` synced)
3. Press `F5` to launch the Extension Development Host

If things feel stale:

- Stop the watcher
- Run `pnpm run compile` once
- Restart `pnpm run dev`

## “Steal this architecture” checklist

If you’re replicating this repo for your own extension, keep these boundaries:

- **Input layer** (here: git diff) isolated from business logic
- **Provider/service layer** (here: AI providers) behind a registry interface
- **Pure validation** in a deterministic module + smoke tests
- **User prompts** centralized (provider/key/model selection)
- **Logging** behind a single output channel with a debug flag

## In this repo: what to click / search (do this now)

- **Manifest wiring**: open `package.json`
  - Find `contributes.commands` (command ids + titles)
  - Find `contributes.menus["scm/title"]` (SCM toolbar integration)
  - Find `contributes.configuration` (settings schema)
  - Find `activationEvents` (when VS Code loads the extension)
- **Runtime entrypoint**: open `src/extension.ts`
  - Find `export function activate(context: vscode.ExtensionContext)`
  - Find registrations for command ids like `haiku-commit.generate`
- **Build output**: open `out/extension.js` (read-only mental model)
  - This is what VS Code actually runs at runtime

## Try it (5 minutes)

1. In `package.json`, copy the command id for generation: `haiku-commit.generate`
2. In `src/extension.ts`, search that exact string and confirm it’s registered via `vscode.commands.registerCommand(...)`.
3. Press `F5`, then open Command Palette and run **Generate Haiku Commit Message**.

## Next guide

Continue to **Guide 02 — Commands end-to-end** to walk through contributions, activation, and handlers:

- [`docs/guides/02-commands-end-to-end.md`](./02-commands-end-to-end.md)


