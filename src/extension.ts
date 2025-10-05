// extension.ts
import * as vscode from 'vscode';
import { getStagedDiff } from './git/diff';
import {
  generateHaiku,
  showAnthropicError,
} from './providers/anthropicProvider';
import {
  generateWithValidation,
  isStrict575,
  normalizeHaiku,
} from './haiku/validate';

export function activate(context: vscode.ExtensionContext) {
  // Status bar item to guide API key setup
  const statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusItem.name = 'Haiku Commit';
  statusItem.text = '$(key) Set Haiku API Key';
  statusItem.tooltip = 'Set Anthropic API key for Haiku Commit';
  statusItem.command = 'haiku-commit.setApiKey';

  const refreshStatusItem = () => {
    const key =
      vscode.workspace
        .getConfiguration('haikuCommit')
        .get<string>('anthropicApiKey') || '';
    if (!key) statusItem.show();
    else statusItem.hide();
  };
  refreshStatusItem();

  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('haikuCommit.anthropicApiKey')) {
      refreshStatusItem();
    }
  });

  const setApiKeyCommand = vscode.commands.registerCommand(
    'haiku-commit.setApiKey',
    async () => {
      const config = vscode.workspace.getConfiguration('haikuCommit');
      const input = await vscode.window.showInputBox({
        prompt: 'Enter your Anthropic API key',
        password: true,
        placeHolder: 'sk-ant-...',
      });
      if (!input) return;
      await config.update(
        'anthropicApiKey',
        input,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage('Haiku API key saved');
      refreshStatusItem();
    }
  );

  context.subscriptions.push(statusItem, configWatcher, setApiKeyCommand);
  let disposable = vscode.commands.registerCommand(
    'haiku-commit.generate',
    async () => {
      try {
        // Workspace detection
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showErrorMessage('No workspace folder found');
          return;
        }

        const workspacePath = workspaceFolder.uri.fsPath;

        // Settings
        const config = vscode.workspace.getConfiguration('haikuCommit');
        let apiKey = config.get<string>('anthropicApiKey') || '';
        const strict575 = config.get<boolean>('strict575', true);
        const maxDiffLength = config.get<number>('maxDiffLength', 4000);
        const samples = Math.min(
          5,
          Math.max(1, config.get<number>('samples', 1))
        );

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
            apiKey = input;
          } else {
            vscode.window.showErrorMessage(
              'API key required to generate haiku'
            );
            return;
          }
        }

        // Compute diff
        let diff: string;
        try {
          diff = await getStagedDiff({
            cwd: workspacePath,
            maxLength: maxDiffLength,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(msg);
          return;
        }

        // Show progress and generate
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating haiku commit message…',
            cancellable: false,
          },
          async () => {
            const items: { text: string; valid: boolean }[] = [];

            for (let i = 0; i < samples; i++) {
              try {
                const result = await generateWithValidation(
                  (extraInstruction?: string) =>
                    generateHaiku(diff, { apiKey, extraInstruction }),
                  { strict: strict575, maxRetries: 2 }
                );
                items.push({ text: result.text, valid: result.valid });
              } catch (err) {
                showAnthropicError(err);
                return;
              }
            }

            const insertHaiku = async (haiku: string) => {
              const clean = normalizeHaiku(haiku);
              const gitExtension =
                vscode.extensions.getExtension('vscode.git')?.exports;
              const git = gitExtension?.getAPI(1);
              if (git && git.repositories.length > 0) {
                git.repositories[0].inputBox.value = clean;
                vscode.window.showInformationMessage(
                  'Haiku commit message generated! 🌸'
                );
              } else {
                const action = await vscode.window.showInformationMessage(
                  `Generated Haiku:\n\n${clean}`,
                  'Copy to Clipboard'
                );
                if (action === 'Copy to Clipboard') {
                  vscode.env.clipboard.writeText(clean);
                }
              }
            };

            if (samples > 1) {
              // QuickPick between multiple options
              const pick = await vscode.window.showQuickPick(
                items.map((it, idx) => {
                  const lines = it.text.split(/\r?\n/);
                  const label = lines[0] || `Haiku ${idx + 1}`;
                  const detail = `${lines[1] ?? ''} / ${lines[2] ?? ''}`.trim();
                  const description = it.valid ? '5-7-5' : 'approximate';
                  return {
                    label,
                    detail,
                    description,
                    value: it.text,
                  } as vscode.QuickPickItem & { value: string };
                }),
                { placeHolder: 'Select a haiku for your commit message' }
              );
              if (!pick) return;
              await insertHaiku((pick as any).value as string);
              return;
            }

            // Single sample flow
            const only = items[0];
            if (strict575 && !only.valid) {
              const choice = await vscode.window.showQuickPick(
                [
                  { label: 'Use best attempt', value: 'use' },
                  { label: 'Try again', value: 'retry' },
                  { label: 'Cancel', value: 'cancel' },
                ],
                { placeHolder: 'Strict 5-7-5 failed after retries. What next?' }
              );
              if (!choice || choice.value === 'cancel') return;
              if (choice.value === 'retry') {
                // One more full pass
                try {
                  const re = await generateWithValidation(
                    (extraInstruction?: string) =>
                      generateHaiku(diff, { apiKey, extraInstruction }),
                    { strict: true, maxRetries: 2 }
                  );
                  await insertHaiku(re.text);
                  return;
                } catch (err) {
                  showAnthropicError(err);
                  return;
                }
              }
              await insertHaiku(only.text);
              return;
            }

            await insertHaiku(only.text);
          }
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Error: ${msg}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
