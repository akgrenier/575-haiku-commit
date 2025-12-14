# Guide 00 — Template this repo into *your* VS Code extension

This repo isn’t just an extension — it’s a blueprint. This guide is the “do this first” path for turning **575-haiku-commit** into *your own* extension repo.

## What you get by templating this repo

- A real, shippable VS Code extension (not a toy)
- Commands + SCM integration patterns
- Settings surface + UX prompts
- Provider layer + retry patterns
- Prompt + deterministic validation + smoke tests
- Release checklist docs

## Step 0 — Clone it (and keep `out/` sacred)

Clone, install, and run the watch build:

```bash
pnpm install
pnpm run dev
```

Then press `F5` to launch the Extension Development Host.

**Rule:** don’t edit `out/` directly. Always edit `src/` and rebuild.

## Step 1 — Rename the extension identity (manifest)

Open `package.json` and update:

- `name` (your extension id)
- `displayName` (human name)
- `description`
- `publisher`
- `repository.url`, `homepage`, `bugs`
- `icon` (swap `575-icon.png`)

Also consider:

- `keywords` (what you want to rank for on Marketplace)
- `categories`

## Step 2 — Rename command ids (and don’t break wiring)

This repo’s command ids are namespaced like:

- `haiku-commit.generate`
- `haiku-commit.setProvider`

If you rename them, you must change them in **two places**:

1. `package.json` → `contributes.commands` / `contributes.menus` / `contributes.keybindings`
2. `src/extension.ts` → `vscode.commands.registerCommand('<id>', ...)`

**Tip:** pick a consistent prefix early (e.g. `myext.*`) and stick with it forever.

## Step 3 — Rename your settings namespace (important for SEO + sanity)

Right now, the settings section is `haikuCommit.*`.

If you’re templating this repo, decide your own namespace (e.g. `myExt.*`) and update:

- `package.json` → `contributes.configuration.properties`
- `src/extension.ts` → `const configSection = 'haikuCommit'`
- any `when` clauses referencing `config.haikuCommit.*` in `contributes.menus`

This is worth doing early because it’s painful to migrate later.

## Step 4 — Decide activation strategy

This repo currently uses:

- `activationEvents: ["workspaceContains:.git"]`

If your extension is command-first, you probably want:

- `onCommand:<commandId>`

If your extension needs “always on when repo present” behavior (SCM affordances), a broader activation event can be justified.

## Step 5 — Replace the “business logic” while keeping the architecture

Here’s the architecture you’re meant to steal:

- **Input layer**: `src/git/` (replace with your input source)
- **Providers/services**: `src/providers/` (keep the registry pattern)
- **Prompt shaping**: `src/prompt/` (swap prompt contract)
- **Validation**: `src/haiku/` (swap rules + keep deterministic tests)
- **HTTP utilities**: `src/http/`
- **Logging**: `src/logging.ts`

If you rip out everything at once, you’ll break the learning value. Instead:

1. Keep the command + SCM wiring intact
2. Replace the “generate” handler’s pipeline step-by-step:
   - input → processing → output

## Step 6 — Update docs to match your new product

Minimum doc changes when you template:

- `README.md`: new hero + quickstart + screenshots
- `docs/GUIDES.md`: update guide framing to your repo
- `docs/guides/*`: keep as learning docs if you want to be a blueprint repo

## Try it (template smoke test)

After renaming:

1. `pnpm run dev`
2. Press `F5`
3. Confirm your renamed command shows in Command Palette
4. Confirm it runs and writes output somewhere visible (SCM input box, notification, etc.)

If it doesn’t:

- the command id is probably mismatched between `package.json` and `registerCommand()`.

## Further reading

- VS Code docs: Extension Anatomy — `https://code.visualstudio.com/api/get-started/extension-anatomy`
- VS Code docs: Commands — `https://code.visualstudio.com/api/extension-guides/command`
- VS Code docs: Activation Events — `https://code.visualstudio.com/api/references/activation-events`

## Next guide

Continue to **Guide 01 — Extension anatomy** to get a mental model of the repo layout:

- [`docs/guides/01-extension-anatomy.md`](./01-extension-anatomy.md)


