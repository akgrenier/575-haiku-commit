# Changelog

## [1.0.2] - 2025-10-12

### Added

- Marketplace listing created: `AIMatey.575-haiku-commit`.
- README hero image, Gallery with captions, and installation success check.
- Maintainers, Support, and Versioning sections.

### Changed

- Package name to `575-haiku-commit`; displayName to “575 Haiku Commit”.
- Repository/homepage/bugs URLs to new repo.
- Settings title to “575 Haiku Commit”; trimmed activation events.

### Removed

- Committed `.vsix` artifacts from history and added ignore rule.

### Security

- Verified no secrets in code/README; documented provider endpoints.

[1.0.2]: https://github.com/akgrenier/575-haiku-commit/releases/tag/v1.0.2

All notable changes to this project will be documented in this file.

## [1.0.1]

### Changed

- Added support for Openai, Anthropic, and Gemini latest models
- Added model management
- Repository renamed to `575-haiku-commit`; updated `package.json` repository/homepage/bugs.
- README project structure updated to `575-haiku-commit/`.
- Consolidated publish checklist; moved roadmap items into README.

### Added

- CI workflow to build on push/PR using pnpm and Node 20.

### Security

- Clarified credential handling in README (keys in VS Code settings, no telemetry).

## [1.0.0]

### Changed

- MVP Launched, manual trigger works and creates haiku
- Identified immediage ux and prompting gaps

### Added

- Status bar functions
- Print quantity control
- Strict 575 control

### Security

- Set up publisher id
