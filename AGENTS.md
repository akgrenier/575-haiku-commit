# Repository Guidelines

## Project Structure & Module Organization
- `src/extension.ts` holds the VS Code activation logic, command registration, and Anthropic API integration.
- `out/` contains compiled JavaScript; regenerate it via the build commands rather than editing by hand.
- `package.json` defines the extension manifest, scripts, and market metadata; `tsconfig.json` enforces strict TypeScript compilation.
- `readme.md` documents user-facing setup, while `node_modules/` is managed by the package manager and should stay untracked.

## Build, Test, and Development Commands
- `pnpm install` installs extension dependencies; run it after cloning or when packages change.
- `pnpm run compile` performs a one-off TypeScript build into `out/` and must succeed before publishing.
- `pnpm run watch` keeps `out/` in sync during active development.
- `pnpm run package` uses `vsce` to bundle the extension for Marketplace distribution.
- In VS Code, press `F5` (Debug: Start Debugging) to launch a development host with the extension loaded.

## Coding Style & Naming Conventions
- TypeScript is compiled with `strict` settings; resolve all type errors instead of suppressing them.
- Prefer camelCase for variables and functions, PascalCase for exported classes, and meaningful command IDs (e.g., `haiku-commit.generate`).
- Maintain 2-space indentation to match the existing source file and avoid trailing whitespace in haiku strings.

## Testing Guidelines
- Automated tests are not yet present; validate changes by running the extension via `F5`, staging sample diffs, and confirming haiku generation end-to-end.
- When adding tests, place them alongside the feature (e.g., `src/__tests__/extension.test.ts`) and name them after the command or API surface they cover.
- Keep manual test notes in PR descriptions until a formal test suite exists.

## Commit & Pull Request Guidelines
- The repository has no git history yet; begin with Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) to keep messages informative for release notes.
- Scope commits narrowly, explaining the user-facing effect in the first line and elaborating in the body when needed.
- Pull requests should summarize the change, list manual tests (screenshots welcome for UI changes), and link any tracking issues.
- Mention API key impact or configuration changes explicitly so reviewers can verify security-sensitive paths.

## Security & Configuration Tips
- Never commit Anthropic API keys; rely on VS Code settings (`haikuCommit.anthropicApiKey`) which store credentials outside the repo.
- If you add new configuration, document the required settings in `readme.md` and consider adding schema defaults in `package.json`.
