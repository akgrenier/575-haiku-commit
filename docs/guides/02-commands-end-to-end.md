# Guide 02 — Commands end-to-end (manifest → activation → handler)

This guide shows how commands work in VS Code extensions, using this repo as the concrete reference. You’ll learn the whole pipeline:

`package.json` (contributes) → activation events → `activate()` → `registerCommand()` → handler code → UI surfaces.

## The mental model (keep this in your skull)

- A command can **exist in the UI** (declared in `package.json`) but still **do nothing** if your extension never activates or never registers it.
- Your extension can **activate** but a command can still **not appear** if it’s not contributed correctly.
- “Command not found” usually means: contributed but not registered, or activation never happened.

## Step 1: Declare commands (the manifest surface)

In `package.json`, VS Code reads:

- `contributes.commands`: what shows up in the Command Palette (id + title)
- `contributes.keybindings`: optional shortcuts
- `contributes.menus`: optional placements (SCM toolbar, editor context, etc.)

Think of `package.json` as your extension’s **public API**.

### Common failure modes

- **The id mismatches code** (typo differences between `package.json` and `registerCommand()`).
- **You contributed a keybinding**, but **not the command**.
- You contributed menus/keybindings, but the command handler throws instantly (appears “broken”).

## Step 2: Ensure activation happens

VS Code will only load your extension when an **activation event** triggers.

The most reliable activation pattern for command-driven extensions is:

- `onCommand:<your.command.id>`

That way VS Code activates your extension as soon as the user tries to run the command.

### In this repo: the current activation choice (and what it implies)

This repo currently activates via:

- `activationEvents: ["workspaceContains:.git"]` in `package.json`

That means the extension loads when VS Code sees a `.git` folder in the workspace (instead of waiting for a command).

**Trade-off:**

- Faster “it’s just there” UX for SCM features
- But you pay some startup cost vs `onCommand:` activation

If you’re copying this architecture for your own extension, the default recommendation is still:

- `onCommand:...` for command-first extensions
- a broader activation event only when you truly need background presence

### Common failure modes

- Missing `onCommand:...` activation event → the command can exist in the UI, but the extension never loads.
- Activation is too broad (slow startup, perf pain).

## Step 3: Register commands in `activate()`

At runtime, your extension must register each command id:

- `vscode.commands.registerCommand(commandId, handler)`

Best practice: push the disposable into `context.subscriptions` so VS Code cleans up on reload.

### In this repo: exact command ids + where they’re registered

Open `package.json` → `contributes.commands`. The key command ids are:

- `haiku-commit.generate`
- `haiku-commit.setApiKey`
- `haiku-commit.setProvider`
- `haiku-commit.setModel`
- `haiku-commit.showLogs`

Then open `src/extension.ts` and search those ids to see their `vscode.commands.registerCommand(...)` calls.

### Pattern to copy

- Keep handlers small.
- Put real work in separate modules (so you can test and refactor without touching activation wiring).

## Step 4: Implement handler code (and avoid UX footguns)

Your handler should be:

- **Fast to start** (show progress UI quickly if you’ll do work)
- **Safe** (validate inputs, handle missing settings/keys)
- **Actionable on failure** (show a useful message, log details to an output channel)

In this repo’s shape, handlers typically:

1. Read settings (provider, model, flags)
2. Fetch/compute input (here: staged git diff)
3. Call provider(s)
4. Validate/normalize output (here: 5‑7‑5)
5. Write result back into VS Code UI (here: SCM input box)

## Step 5: Expose the command in multiple UX surfaces (optional)

One command can be reachable from multiple places:

- Command Palette
- Keyboard shortcut
- SCM toolbar button (source control title bar)
- Status bar actions (for setup flows)

Guideline: **keep one canonical command id**, then wire multiple entry points to it.

## Debugging checklist (when command UX is cursed)

When “it doesn’t show up” or “it doesn’t run”, check in this order:

1. **Manifest**: is the command listed in `contributes.commands`?
2. **Activation**: does `activationEvents` include `onCommand:<id>`?
3. **Runtime registration**: does `activate()` call `registerCommand(<id>, ...)`?
4. **Errors**: open the Developer Tools console + Output channel; do you see an exception?
5. **Reload**: reload the Extension Development Host (or restart the TS watcher if stale).

## Try it (repo exercise)

1. In `package.json`, change the title of one command (e.g. “Show Haiku Logs”) and reload the Extension Development Host.
2. Confirm the Command Palette displays the new title.
3. Now break it on purpose: change the command id in `package.json` but do **not** change `src/extension.ts`.
4. Reload and observe: the command shows up, but fails at runtime — that’s the manifest/runtime mismatch this guide is trying to inoculate you against.

## “Steal this for your extension”

If you’re building your own extension, copy this structure:

- `src/extension.ts` registers commands and delegates to modules
- a `commands/` module (or similar) that exports handlers
- a `logging` module for Output channel + debug flag
- a `settings` module for configuration lookup + defaults

It keeps activation boring and your real logic testable.

## Next guide

If you want the *next* guide to follow naturally after commands, the strongest follow-up is:

- **Settings + secrets (SecretStorage) end-to-end**: config schema, prompts, safe storage, and migration.
  - [`docs/guides/03-settings-and-secretstorage.md`](./03-settings-and-secretstorage.md)


