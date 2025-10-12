# Release Prep Checklist

Use this checklist before tagging or publishing a new version of 575 Haiku Commit. It combines security hygiene, build verification, and Marketplace tasks so the public repo stays clean.

## 1. Install & Sync

- `pnpm install`
- `pnpm run release:verify` (runs secretlint, rebuilds `out/`, executes `scripts/test-validate.js`)

## 2. Manual Validation

- Launch the Extension Development Host (`F5`).
- Stage a sample diff and run `Haiku Commit: Generate` — confirm the haiku lands in the SCM input box.
- Hit "Set Provider", "Set Model", and "Set API Key" to confirm prompts + status bar behaviors for each provider.
- Enable `haikuCommit.debug`, reproduce a generation, and review the output channel for helpful diagnostics. Disable the flag once satisfied.

## 3. Packaging

- `pnpm run package` (or `pnpm dlx vsce package --no-dependencies`).
- Verify `.vsix` stays untracked.

## 4. Release

- Bump `package.json` version if needed.
- Commit + tag (`git tag vX.Y.Z && git push origin vX.Y.Z && git push --tags`).
- Publish with `pnpm dlx vsce publish --no-dependencies`.
- Flip the GitHub repo visibility to Public once ready and confirm README links resolve.

### Release notes template (example for v1.0.2)

```
## 1.0.2 – First Marketplace publish

Added
- Initial Marketplace listing (AIMatey.575-haiku-commit)
- Gallery screenshots/GIF, hero image, installation success check
- Maintainers, Support, Versioning sections

Changed
- Package renamed to 575-haiku-commit; settings title aligned
- Repo links updated in package.json

Removed
- Committed .vsix artifacts; added ignore rule

Security
- Verified no secrets in code/README; documented provider endpoints
```

## 5. Final Checks

- Update screenshots or GIFs in `media/` when UI changes.
- Ensure README Roadmap matches the new plan and remove any internal-only notes.
- Capture manual validation notes in the PR or release description for traceability.
