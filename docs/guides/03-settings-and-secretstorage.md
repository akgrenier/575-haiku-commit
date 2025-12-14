# Guide 03 — Settings + SecretStorage (keys done right)

This guide covers two things every real VS Code extension needs:

1. **Settings**: how you define them, read them, write them, and evolve them without breaking users.
2. **Secrets**: how you store API keys safely using **`SecretStorage`** (and how to migrate away from insecure patterns).

This repo is a great teaching example because it has a non-trivial settings surface (provider/model/strictness/debug/etc.) and a “key required” flow.

## Part A — Settings (configuration) end-to-end

### 1) Define settings in `package.json`

Your settings schema lives under:

- `contributes.configuration`

This is where you declare:

- keys (e.g. `myExt.provider`)
- types (`string`, `boolean`, `number`)
- defaults
- descriptions
- enums + dropdowns
- scope (user vs workspace) depending on how you structure your schema

**Rule of thumb:** your configuration schema *is your public API*. Treat changes like you’d treat breaking API changes.

### In this repo: the settings you can follow along with

Open `package.json` and find `contributes.configuration.properties`. You’ll see the real keys this extension uses, including:

- `haikuCommit.provider`
- `haikuCommit.model` (shared override)
- `haikuCommit.openaiModel` / `haikuCommit.geminiModel` (provider-specific)
- `haikuCommit.strict575`, `haikuCommit.samples`, `haikuCommit.maxTokens`, `haikuCommit.maxRetries`
- `haikuCommit.debug`
- and (currently) API keys like `haikuCommit.openaiApiKey`

## Copy this pattern (settings + change watcher)

```ts
import * as vscode from 'vscode';

const section = 'myExt';

export function getSettings() {
  const cfg = vscode.workspace.getConfiguration(section);
  return {
    enabled: cfg.get<boolean>('enabled', true),
    mode: cfg.get<string>('mode', 'default'),
  };
}

export function watchSettings(onChange: () => void) {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration(`${section}.enabled`) || e.affectsConfiguration(`${section}.mode`)) {
      onChange();
    }
  });
}
```

### 2) Read settings at runtime

In code, you typically read via:

- `vscode.workspace.getConfiguration('<section>')`

Patterns worth copying:

- centralize reads in a `settings.ts` helper
- provide safe defaults
- keep “effective settings” logic in one place (especially when precedence is involved)

### In this repo: where settings are read + applied

Open `src/extension.ts` and look for:

- `const configSection = 'haikuCommit'`
- `readSetting(...)` helper (safe defaults)
- `refreshStatusItem()` (derives “effective model” and whether a key is missing)
- the generate command handler (`haiku-commit.generate`) where it reads:
  - provider, model, retries, tokens, samples, strictness

### 3) React to settings changes

To keep UI (status bar, etc.) in sync without forcing reloads:

- subscribe to `vscode.workspace.onDidChangeConfiguration`
- update cached values and refresh UI

**Avoid:** recomputing everything on every config change. Gate on `e.affectsConfiguration(...)` for only the keys you care about.

### In this repo: live UI updates when settings change

In `src/extension.ts`, the `configWatcher` listens to `onDidChangeConfiguration` and refreshes:

- the status bar “set key” affordance
- the model status item text/tooltip

### 4) Write settings (and pick scope intentionally)

When you update settings programmatically, choose a target:

- `vscode.ConfigurationTarget.Global` (user-level)
- `vscode.ConfigurationTarget.Workspace` (workspace-level)

For extension “identity” settings (provider choice, UX defaults), user-level is often right.
For workspace-specific behavior, workspace-level may be better.

### In this repo: programmatic setting updates

Search `src/extension.ts` for `config.update(`. You’ll see patterns like:

- `ConfigurationTarget.Global` when saving provider, model, and API keys

## Part B — API keys: why settings are the wrong place

Storing API keys in settings is tempting because it’s easy and you get a settings UI “for free”.

But it’s not ideal:

- Settings can leak through screenshots, dotfiles, sync, or accidental sharing.
- It normalizes the habit of putting secrets in places that are designed for **configuration**, not **secrets**.

### What this repo does today (and why)

Today, this extension stores provider keys in VS Code Settings (e.g. `haikuCommit.openaiApiKey`).

That’s simple, and it works — but for a “teach people to build extensions” repo, we should be explicit:

- **Best practice is `SecretStorage`.**

The rest of this guide shows the “right” implementation pattern you can copy into your own extension (and a clean migration strategy if you already shipped a settings-based key).

## Copy this pattern (SecretStorage + migration)

```ts
import * as vscode from 'vscode';

const section = 'myExt';
const secretKey = (provider: string) => `${section}.apiKey.${provider}`;

export async function getApiKey(ctx: vscode.ExtensionContext, provider: string) {
  return await ctx.secrets.get(secretKey(provider));
}

export async function setApiKey(ctx: vscode.ExtensionContext, provider: string, value: string) {
  await ctx.secrets.store(secretKey(provider), value);
}

export async function migrateApiKeyFromSettings(
  ctx: vscode.ExtensionContext,
  provider: string,
  oldSettingKey: string
) {
  const cfg = vscode.workspace.getConfiguration(section);
  const old = (cfg.get<string>(oldSettingKey) || '').trim();
  const existing = await getApiKey(ctx, provider);
  if (old && !existing) {
    await setApiKey(ctx, provider, old);
    await cfg.update(oldSettingKey, '', vscode.ConfigurationTarget.Global);
  }
}
```

## Try it (repo exercise)

1. In the Extension Development Host, open Settings and change `haikuCommit.debug`.
2. Confirm the Output channel (`Haiku Commit`) immediately starts/stops logging extra detail.
3. Run **Haiku Commit: Set Haiku Provider**, then confirm the status bar model indicator updates (that’s `refreshStatusItem()` reacting to settings).

## Part C — `SecretStorage` (the “keys done right” pattern)

### 1) Store secrets via `context.secrets`

VS Code gives your extension a per-user secret store:

- `context.secrets` (type: `vscode.SecretStorage`)

Core operations:

- `await context.secrets.get('myExt.openaiApiKey')`
- `await context.secrets.store('myExt.openaiApiKey', key)`
- `await context.secrets.delete('myExt.openaiApiKey')`

Example helper (pattern):

```ts
import * as vscode from 'vscode';

const secretKeyForProvider = (provider: string) => `myExt.apiKey.${provider}`;

export async function getApiKey(
  context: vscode.ExtensionContext,
  provider: string
): Promise<string | undefined> {
  return await context.secrets.get(secretKeyForProvider(provider));
}

export async function setApiKey(
  context: vscode.ExtensionContext,
  provider: string,
  value: string
): Promise<void> {
  await context.secrets.store(secretKeyForProvider(provider), value);
}
```

### 2) Prompt UX: safe input, actionable messages

When you need a key:

- use `showInputBox({ password: true })`
- do not log the raw key
- show a success message like “API key saved”

If you support multiple providers, build the key prompt off “current provider”.

### 3) Update UI when secrets change (optional but nice)

You can listen for secret changes:

- `context.secrets.onDidChange(...)`

That’s how you keep status bar affordances accurate when keys are added/removed.

### 4) Debugging without leaking secrets

Logging rules:

- Never log the key.
- When debugging, log only whether a key is present (boolean) and which provider is selected.

If you run a secret scanner (this repo does), that’s a second line of defense — not the first.

## Part D — Migration strategy (if you already shipped keys in settings)

If you shipped `myExt.openaiApiKey` in settings and want to move to secrets:

1. **Read** the old setting once on activation.
2. If it exists and secret store is empty:
   - **store it** into `SecretStorage`
   - **clear the setting** (or leave it but ignore it going forward)
3. Prefer secrets as the source of truth going forward.

Example migration sketch:

```ts
const cfg = vscode.workspace.getConfiguration('myExt');
const old = cfg.get<string>('openaiApiKey');
const existingSecret = await context.secrets.get('myExt.apiKey.openai');

if (old && !existingSecret) {
  await context.secrets.store('myExt.apiKey.openai', old);
  await cfg.update('openaiApiKey', '', vscode.ConfigurationTarget.Global);
}
```

**Trade-off:** clearing the setting can surprise users who expect to see the value; but that’s also the point — secrets shouldn’t be displayed in config UI.

## “Steal this” checklist

- Settings schema is your public API: version changes carefully.
- Centralize settings reads + “effective” precedence logic.
- Store API keys in `SecretStorage`, not configuration.
- Migrate once, then keep secrets as the source of truth.
- Never log secrets (even when debug is on).

## Next guide

If you want the next guide to build naturally after settings/secrets, a great follow-up is:

- **SCM integration end-to-end**: Source Control input box, SCM toolbar buttons, multi-repo handling, and UX polish.
  - [`docs/guides/04-scm-integration.md`](./04-scm-integration.md)

## FAQ (secrets + settings gotchas)

- **Where are secrets stored?**
  - In VS Code’s OS-backed secret store (platform-dependent). Extensions access it via `context.secrets`.
- **Will secrets sync via Settings Sync?**
  - Settings can sync; SecretStorage is not “just a setting value”. Treat it as sensitive and don’t assume it syncs the same way.
- **How do I let users clear a key?**
  - Provide a command that calls `context.secrets.delete(...)` (or prompt them to clear the setting if you’re still settings-based).

## Further reading

- VS Code docs: Contribution Points (Configuration) — `https://code.visualstudio.com/api/references/contribution-points`
- VS Code API reference: `ExtensionContext.secrets` / `SecretStorage` — `https://code.visualstudio.com/api/references/vscode-api`
- VS Code samples: `microsoft/vscode-extension-samples` — `https://github.com/microsoft/vscode-extension-samples`


