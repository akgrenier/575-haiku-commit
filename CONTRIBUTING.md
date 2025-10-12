# Contributing to Haiku Commit

Thanks for helping make commit messages a little more poetic. This guide explains how to build, propose changes, and ship high‑quality contributions.

## Project at a glance

- VS Code extension (TypeScript, strict mode)
- Source in `src/`, compiled output in `out/`
- Multiple AI providers: Anthropic, OpenAI, Gemini

## Prerequisites

- Node.js 16+ (VS Code 1.80 runtime is Node 16)
- pnpm (`npm i -g pnpm`)
- VS Code 1.80+

## Setup

```bash
pnpm install
pnpm run compile
```

Launch an Extension Development Host from VS Code with F5.

## Dev workflow

- One‑shot build: `pnpm run compile`
- Watch mode: `pnpm run watch`
- Package: `pnpm run package`

Keep `out/` generated; never edit it by hand.

## Code style & conventions

- TypeScript with `strict: true` — fix errors, don’t suppress
- 2‑space indentation; camelCase for functions/vars; PascalCase for exported classes
- Avoid trailing whitespace in haiku strings
- Comments focus on intent, edge cases, or non‑obvious rationale

## Security & configuration

- Never commit API keys
- Keys are provided via VS Code settings:
  - `haikuCommit.anthropicApiKey`
  - `haikuCommit.openaiApiKey`
  - `haikuCommit.geminiApiKey`
- If you add new settings, document them in `README.md` and the `package.json` configuration schema

## Commits & PRs

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, etc.
- Keep scope narrow and user‑visible
- In PR description, include:
  - Behavior change summary
  - Manual validation steps (see below)
  - Screenshots or terminal output when useful
  - Any configuration updates reviewers must apply

## Manual validation (until tests exist)

Run in an Extension Development Host and verify:

- Command Palette: “Generate Haiku Commit Message” works in a Git repo
- Status bar/API key prompts appear when the selected provider key is missing
- Multiple providers:
  - Anthropic, OpenAI, Gemini all generate
  - Non‑strict mode labels “5‑7‑5” only when it truly matches
- Edge cases:
  - No staged changes → friendly error
  - Large diffs → truncated with a marker
  - Cancellation works without leaving junk state

## Issue triage

- Bugs: clear repro steps, expected vs. actual, VS Code version, provider used
- Features: describe the UX and why it helps; keep MVP small

## Release (maintainers)

- Ensure `pnpm run compile` passes
- `pnpm run package` to build a `.vsix`
- Publish with `vsce publish`

Thanks for contributing!
