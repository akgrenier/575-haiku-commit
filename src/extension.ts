// extension.ts
import * as vscode from 'vscode';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'haiku-commit.generate',
    async () => {
      try {
        // Get the workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        const workspacePath = workspaceFolder.uri.fsPath;

        // Check if git repo exists
        try {
          execSync('git rev-parse --git-dir', { cwd: workspacePath });
        } catch {
          vscode.window.showErrorMessage('Not a git repository');
          return;
        }

        // Get staged changes
        const diff = execSync('git diff --cached', {
          cwd: workspacePath,
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024 * 10,
        });

        if (!diff.trim()) {
          vscode.window.showWarningMessage(
            'No staged changes found. Please stage your changes first.'
          );
          return;
        }

        // Show progress
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating haiku commit message...',
            cancellable: false,
          },
          async () => {
            // Generate haiku using AI
            const haiku = await generateHaikuCommit(diff);

            if (haiku) {
              // Get the Source Control API
              const gitExtension =
                vscode.extensions.getExtension('vscode.git')?.exports;
              const git = gitExtension?.getAPI(1);

              if (git && git.repositories.length > 0) {
                // Set the commit message in the Source Control input box
                git.repositories[0].inputBox.value = haiku;
                vscode.window.showInformationMessage(
                  'Haiku commit message generated! 🌸'
                );
              } else {
                // Fallback: show the haiku in a message
                const action = await vscode.window.showInformationMessage(
                  `Generated Haiku:\n\n${haiku}`,
                  'Copy to Clipboard'
                );
                if (action === 'Copy to Clipboard') {
                  vscode.env.clipboard.writeText(haiku);
                }
              }
            }
          }
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  id: string;
  model: string;
  role: string;
}

async function generateHaikuCommit(diff: string): Promise<string | null> {
  try {
    const config = vscode.workspace.getConfiguration('haikuCommit');
    const apiKey = config.get<string>('anthropicApiKey');

    if (!apiKey) {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter your Anthropic API key',
        password: true,
        placeHolder: 'sk-ant-...',
      });

      if (input) {
        await config.update(
          'anthropicApiKey',
          input,
          vscode.ConfigurationTarget.Global
        );
        return generateHaikuCommit(diff);
      } else {
        vscode.window.showErrorMessage('API key required to generate haiku');
        return null;
      }
    }

    // Truncate diff if too long
    const maxDiffLength = 4000;
    const truncatedDiff =
      diff.length > maxDiffLength
        ? diff.substring(0, maxDiffLength) + '\n... (truncated)'
        : diff;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Based on this git diff, write a commit message as a haiku (5-7-5 syllable pattern).
The haiku should capture the essence of the changes.
Only respond with the haiku, nothing else.

Git diff:
${truncatedDiff}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = (await response.json()) as ClaudeResponse;
    return data.content[0].text.trim();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to generate haiku: ${error}`);
    return null;
  }
}

export function deactivate() {}
