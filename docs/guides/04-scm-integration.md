# Guide 04 — SCM integration end-to-end (commit box + SCM toolbar)

This guide shows how to integrate with VS Code’s Source Control UI in a way that feels native:

- Add a button to the **SCM title bar** (next to Commit / Refresh / etc.)
- Read from the user’s repo(s)
- Write your output into the **commit message input box**
- Handle **multi-repo** workspaces without making users hate you

This repo does all of the above, so you can copy the patterns.

## Part A — Add a button to the SCM toolbar (manifest-only)

VS Code’s SCM view has menu locations you can contribute to from `package.json`.

In this repo, the command is contributed to:

- `contributes.menus["scm/title"]`

Key points:

- Gate it so it only shows for Git:
  - `when: "scmProvider == git"`
- Put it in a sensible group:
  - `group: "navigation"`

### Bonus: context-aware setup buttons

This repo also conditionally shows **Set API Key** in the SCM toolbar only when the key is missing (per provider), using `when` clauses that read settings:

- `config.haikuCommit.provider == 'openai' && config.haikuCommit.openaiApiKey == ''`

This is a great UX trick: **don’t nag**, just show the affordance where the user already is.

### In this repo: where this is declared

Open `package.json` and find:

- `contributes.menus["scm/title"]`
- `contributes.keybindings` (the shortcut is scoped with `when: "scmProvider == git"`)

## Part B — Keyboard shortcut scoped to SCM

You can attach a keybinding that only works when Git SCM is active:

- `contributes.keybindings[].when: "scmProvider == git"`

That prevents global shortcut collisions and keeps behavior predictable.

## Part C — Get access to the Git repositories (runtime)

VS Code exposes Git integration via the built-in Git extension:

- extension id: `vscode.git`
- exported API version: `getAPI(1)`

The runtime pattern (as used here):

1. Get the extension: `vscode.extensions.getExtension('vscode.git')`
2. Get its API: `exports.getAPI(1)`
3. Read `git.repositories` (can be 0, 1, or many)

### In this repo: the actual implementation

Open `src/extension.ts` and search for:

- `vscode.extensions.getExtension<GitExtension>('vscode.git')`
- `git.repositories`
- `context.workspaceState` (remembering the last selected repo)

### Multi-repo handling (don’t be weird)

When `git.repositories.length > 1`, you have a choice:

**Option 1 (recommended):** prompt once, remember forever  
That’s what this repo does:

- Build a QuickPick list of repositories
- Save the selection in `context.workspaceState`
- Reuse it next time automatically

This reduces repetitive prompts while still letting users work in monorepos / multi-root workspaces.

**Option 2:** always prompt  
Simple, but annoying.

**Option 3:** guess (first repo)  
Fast, but wrong often enough to be infuriating.

## Part D — Write into the commit message input box

The magic UX move: write directly into the SCM commit input.

With the Git API, each repository exposes an `inputBox` model:

- `repo.inputBox.value = "your message"`

In this repo, after generating and normalizing the haiku, it does exactly that.

### In this repo: where the commit box write happens

In `src/extension.ts`, search for:

- `repoForInsert.inputBox.value = clean;`

### Fallback behavior (when Git API isn’t available)

Good extensions degrade gracefully. This repo falls back to:

- showing the generated text in a message
- offering “Copy to Clipboard”

This matters because:

- users can disable the Git extension
- some environments don’t provide Git SCM the same way

## Part E — UX polish checklist (copy this)

- **Scope commands** to Git SCM via `when: scmProvider == git`
- **Show progress UI** while work happens (don’t freeze the UI thread)
- **Support cancellation** (via `withProgress` + cancellation token)
- **Normalize output** before inserting (trim, enforce line endings, etc.)
- **Be multi-repo aware**
- **Remember last repo** to avoid repeat prompts
- **Have a clipboard fallback**

## Debugging: when the button doesn’t show up

1. Confirm your command exists in `contributes.commands`.
2. Confirm `contributes.menus["scm/title"]` includes your command.
3. Confirm the `when` clause is true (e.g. `scmProvider == git`).
4. Reload the Extension Development Host.
5. If still missing, check:
   - you’re in a Git repo
   - the built-in Git extension is enabled

## Try it (repo exercise)

1. Open a workspace with a git repo and stage a small change.
2. In the SCM view:
   - Click the **Generate Haiku Commit Message** button (SCM title bar), or press `Cmd/Ctrl+Shift+H`.
3. Confirm the haiku appears directly in the SCM commit message box.
4. Optional: open a multi-root workspace with 2 git repos and watch the repo selection QuickPick appear once (then get remembered).

## Next guide

Two great continuations after SCM integration:

- **Provider architecture** (registry + retries + error mapping)
  - [`docs/guides/05-provider-architecture.md`](./05-provider-architecture.md)
- **Output channels + diagnostics** (debug flags, structured logs, reproducible bug reports)


