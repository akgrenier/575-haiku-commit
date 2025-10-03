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
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
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

- `haikuCommit.anthropicApiKey`: Your Anthropic API key for generating haiku commit messages

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
2. Run `npm install`
3. Open in VS Code
4. Press `F5` to start debugging
5. Make changes to `src/extension.ts`
6. Reload the extension window to see changes

## Tips

- Stage meaningful chunks of changes for better haikus
- The AI analyzes your actual code changes to create relevant haikus
- Large diffs are automatically truncated to stay within API limits
- If the haiku doesn't fit, you can always generate a new one!

## Known Issues

- Very large diffs (>4000 characters) are truncated
- Requires active internet connection for AI generation

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
