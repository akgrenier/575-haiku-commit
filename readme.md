# 🌸 Haiku Commit Messages

Generate beautiful haiku commit messages using AI! Transform your git commits into poetic works of art.

## Features

- 🎋 Generate commit messages in traditional haiku format (5-7-5 syllables)
- 🤖 Powered by Claude AI for intelligent, context-aware haikus
- ⚡ Quick keyboard shortcut: `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac)
- 📝 Automatically fills in the Source Control commit message box
- 🎨 Works with any git repository

## Installation

### From Source

1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm run compile` to build the extension
4. Press `F5` in VS Code to open a new window with the extension loaded

### Publishing to VS Code Marketplace

1. Install `vsce`: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Publish: `vsce publish`

## Setup

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
3. Search for "Haiku Commit"
4. Enter your Anthropic API key

### Setting the API key via command or status bar

- Command Palette: run "Haiku Commit: Set Haiku API Key" to paste your key at any time.
- Status Bar: when no key is configured, a key icon appears ("Set Haiku API Key"). Click it to set your key.

Or the extension will prompt you for your API key on first use.

## Usage

### Method 1: Keyboard Shortcut

1. Stage your changes in git
2. Press `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac)
3. Watch as a beautiful haiku appears in your commit message box! 🌸

### Method 2: Command Palette

1. Stage your changes in git
2. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type "Generate Haiku Commit Message"
4. Press Enter

### Method 3: Source Control Button

1. Stage your changes in git
2. Look for the haiku button in the Source Control panel title bar
3. Click it to generate a haiku

### Multiple Options (Samples)

If you set `haikuCommit.samples` to a value greater than 1 (max 5), the extension will generate multiple haikus and present a selection list. Pick your favorite and it will be placed in the SCM input box.

## Example Haikus

```
Code flows like water
Functions merge in harmony
Bugs drift away, fixed
```

```
New feature takes form
Tests guard the changing landscape
Green lights guide the way
```

```
Database tables
Relationships intertwine
Data finds its home
```

## Requirements

- VS Code 1.80.0 or higher
- Git repository
- Anthropic API key

## Extension Settings

This extension contributes the following settings:

- `haikuCommit.anthropicApiKey`: Your Anthropic API key for generating haiku commit messages.
- `haikuCommit.strict575` (default: `true`): Enforce exact 5‑7‑5 syllable counts. If the model output doesn’t match, the extension retries with corrective guidance up to two times.
- `haikuCommit.maxDiffLength` (default: `4000`): Maximum characters of the staged diff sent to the AI. Large diffs are truncated with a marker.
- `haikuCommit.samples` (default: `1`, min `1`, max `5`): Number of haikus to generate and choose from.

When strict mode cannot be satisfied after retries, you can choose to use the best attempt, try again, or cancel.

## Project Structure

```
haiku-commit/
├── src/
│   └── extension.ts      # Main extension code
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Development

1. Clone the repository
2. Run `pnpm install`
3. Open in VS Code
4. Press `F5` to start debugging
5. Make changes to `src/extension.ts`
6. Reload the extension window to see changes

## Tips

- Stage meaningful chunks of changes for better haikus
- The AI analyzes your actual code changes to create relevant haikus
- Large diffs are automatically truncated to stay within API limits
- If the haiku doesn't fit, you can always generate a new one!

## Troubleshooting

- No staged changes: Stage files first (e.g., `git add -p`) then rerun.
- Missing API key: Set `haikuCommit.anthropicApiKey` in Settings or enter it when prompted.
- Rate limits or network errors: The extension retries transient errors with a brief backoff. If failures persist, wait a moment and try again.
- Non‑git folders: The command only works inside a git repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Built with ❤️ using:

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Claude AI by Anthropic](https://www.anthropic.com/)

---

**Enjoy your poetic commits!** 🌸📝✨
