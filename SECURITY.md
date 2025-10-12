# Security Policy

## Supported Versions

We support the latest published extension version and the `main` branch. Older
versions may not receive security updates.

## Reporting a Vulnerability

Please email security@aimatey.dev with:

- Description of the issue and potential impact
- Steps to reproduce (if available)
- A minimal repro or screenshots/logs

We aim to acknowledge reports within 72 hours and provide a remediation plan or
mitigation timeline as soon as possible.

## Handling of Secrets

- Do not attach real API keys in reports.
- The extension stores provider API keys locally in VS Code settings (`haikuCommit.*ApiKey`).
- Never open PRs containing credentials.

Thank you for helping keep users secure.
