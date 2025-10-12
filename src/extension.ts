import * as path from 'path';
import * as vscode from 'vscode';
import { getStagedDiff } from './git/diff';
import { showAnthropicError } from './providers/anthropicProvider';
import { getProvider, type ProviderName } from './providers';
import {
  effectiveModel,
  getCatalog,
  getRecommendedModel,
} from './providers/models';
import {
  generateWithValidation,
  isStrict575,
  normalizeHaiku,
} from './haiku/validate';
import { createChannelLogger, HaikuLogger } from './logging';

const isAbortError = (err: unknown): boolean => {
  return (
    err instanceof vscode.CancellationError ||
    (err instanceof Error && err.name === 'AbortError')
  );
};

interface GitRepository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}

interface GitAPI {
  repositories: GitRepository[];
}

interface GitExtension {
  getAPI(version: 1): GitAPI;
}

interface RepoPickItem extends vscode.QuickPickItem {
  repo: GitRepository;
}

export function activate(context: vscode.ExtensionContext) {
  const LAST_REPO_KEY = 'haikuCommit.lastRepoFsPath';
  const outputChannel = vscode.window.createOutputChannel('Haiku Commit', {
    log: true,
  });
  context.subscriptions.push(outputChannel);

  const configSection = 'haikuCommit';
  const readSetting = <T>(key: string, fallback: T): T => {
    return (
      vscode.workspace.getConfiguration(configSection).get<T>(key) ?? fallback
    );
  };

  let debugEnabled = readSetting<boolean>('debug', false);
  const logger: HaikuLogger = createChannelLogger(
    outputChannel,
    () => debugEnabled
  );

  logger.debug('Haiku Commit logging ready');

  const statusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusItem.name = 'Haiku Commit';
  statusItem.text = '$(key) Set Haiku API Key';
  statusItem.tooltip = 'Set AI provider API key for Haiku Commit';
  statusItem.command = 'haiku-commit.setApiKey';

  const modelStatusItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    99
  );
  modelStatusItem.name = 'Haiku Commit Model';
  modelStatusItem.command = 'haiku-commit.setModel';

  const refreshStatusItem = () => {
    const cfg = vscode.workspace.getConfiguration(configSection);
    const provider =
      (cfg.get<string>('provider', '') as ProviderName) || ('' as any);
    const model = effectiveModel(provider, cfg);
    const key =
      provider === 'openai'
        ? cfg.get<string>('openaiApiKey') || ''
        : provider === 'gemini'
          ? cfg.get<string>('geminiApiKey') || ''
          : provider === 'anthropic'
            ? cfg.get<string>('anthropicApiKey') || ''
            : '';
    statusItem.tooltip = !key
      ? provider
        ? `Set ${provider} API key • Model: ${model}`
        : 'Set AI provider to begin'
      : `Model: ${model} (${provider})`;
    if (!key) statusItem.show();
    else statusItem.hide();

    const shortModel = model.length > 28 ? model.slice(0, 27) + '…' : model;
    modelStatusItem.text = `$(symbol-parameter) Model: ${shortModel}`;
    modelStatusItem.tooltip = provider
      ? `Pick model for ${provider}. Effective: ${model}`
      : 'Pick model (select a provider first)';
    modelStatusItem.show();
  };
  refreshStatusItem();

  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (
      e.affectsConfiguration(`${configSection}.provider`) ||
      e.affectsConfiguration(`${configSection}.anthropicApiKey`) ||
      e.affectsConfiguration(`${configSection}.openaiApiKey`) ||
      e.affectsConfiguration(`${configSection}.geminiApiKey`) ||
      e.affectsConfiguration(`${configSection}.model`) ||
      e.affectsConfiguration(`${configSection}.openaiModel`) ||
      e.affectsConfiguration(`${configSection}.geminiModel`)
    ) {
      refreshStatusItem();
    }
    if (e.affectsConfiguration(`${configSection}.debug`)) {
      debugEnabled = readSetting<boolean>('debug', false);
      logger.info(
        `Debug logging ${debugEnabled ? 'enabled' : 'disabled'} via settings`
      );
    }
  });

  const setApiKeyCommand = vscode.commands.registerCommand(
    'haiku-commit.setApiKey',
    async () => {
      const config = vscode.workspace.getConfiguration(configSection);
      const providerName =
        (config.get<string>('provider', 'anthropic') as ProviderName) ||
        'anthropic';
      const prompt =
        providerName === 'openai'
          ? 'Enter your OpenAI API key'
          : providerName === 'gemini'
            ? 'Enter your Google AI Studio (Gemini) API key'
            : 'Enter your Anthropic API key';
      const placeHolder =
        providerName === 'openai'
          ? 'sk-...'
          : providerName === 'gemini'
            ? 'AIza...'
            : 'sk-ant-...';
      const input = await vscode.window.showInputBox({
        prompt,
        password: true,
        placeHolder,
      });
      if (!input) return;
      const settingKey =
        providerName === 'openai'
          ? 'openaiApiKey'
          : providerName === 'gemini'
            ? 'geminiApiKey'
            : 'anthropicApiKey';
      await config.update(settingKey, input, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Haiku API key saved');
      refreshStatusItem();
    }
  );

  const showLogsCommand = vscode.commands.registerCommand(
    'haiku-commit.showLogs',
    () => {
      outputChannel.show(true);
    }
  );

  const setModelCommand = vscode.commands.registerCommand(
    'haiku-commit.setModel',
    async () => {
      const config = vscode.workspace.getConfiguration(configSection);
      const providerName =
        (config.get<string>('provider', '') as ProviderName) || ('' as any);
      if (!providerName) {
        vscode.window.showWarningMessage(
          'Select a provider first (Haiku Commit: Set Haiku Provider)'
        );
        return;
      }
      const catalog = getCatalog();
      const items = (catalog[providerName] || []).map((m) => ({
        label: m.label || m.id,
        description: m.id,
        value: m.id,
      }));
      items.push({
        label: 'Custom…',
        description: 'Enter a custom model id',
        value: '__custom__',
      } as any);

      const pick = await vscode.window.showQuickPick(
        items as (vscode.QuickPickItem & { value: string })[],
        {
          placeHolder: `Select a ${providerName} model or enter a custom id`,
          ignoreFocusOut: true,
        }
      );
      if (!pick) return;
      if ((pick as any).value === '__custom__') {
        const currentShared = (config.get<string>('model', '') || '').trim();
        const input = await vscode.window.showInputBox({
          prompt: `Enter model id for ${providerName}`,
          value: currentShared,
          ignoreFocusOut: true,
        });
        if (input === undefined) return;
        const trimmed = input.trim();
        await config.update(
          'model',
          trimmed,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `Haiku model set. Effective model: ${trimmed || '(provider default)'}`
        );
        return;
      }
      const chosen = (pick as any).value as string;
      await config.update('model', chosen, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Haiku model set to ${chosen}`);
    }
  );

  const setProviderCommand = vscode.commands.registerCommand(
    'haiku-commit.setProvider',
    async () => {
      const config = vscode.workspace.getConfiguration(configSection);
      const current =
        (config.get<string>('provider', '') as ProviderName) || ('' as any);
      const options: Array<vscode.QuickPickItem & { value: ProviderName }> = [
        {
          label: 'Anthropic',
          description: 'claude‑sonnet family',
          value: 'anthropic' as ProviderName,
        },
        {
          label: 'Gemini 2.5',
          description: 'pro / flash / flash‑lite',
          value: 'gemini' as ProviderName,
        },
        {
          label: 'OpenAI (GPT‑5)',
          description: 'gpt‑5, mini, nano',
          value: 'openai' as ProviderName,
        },
      ].sort((a, b) => a.label.localeCompare(b.label));
      const pick = await vscode.window.showQuickPick(options, {
        placeHolder: `Current: ${current || '(none)'}. Choose provider`,
      });
      if (!pick) return;
      await config.update(
        'provider',
        pick.value,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(
        `Haiku provider set to ${pick.label}`
      );
      // Auto-set recommended model based on shared override state
      const shared = (config.get<string>('model', '') || '').trim();
      const recommended = getRecommendedModel(pick.value);
      if (!shared) {
        // No shared override; set provider-specific default to recommended to guide users
        const key =
          pick.value === 'openai'
            ? 'openaiModel'
            : pick.value === 'gemini'
              ? 'geminiModel'
              : 'model';
        if (key !== 'model') {
          await config.update(
            key,
            recommended,
            vscode.ConfigurationTarget.Global
          );
          vscode.window.showInformationMessage(
            `Model set to recommended: ${recommended}`
          );
        }
      } else {
        // Shared override set; offer to update/keep/clear
        const choice = await vscode.window.showWarningMessage(
          `A shared model override is set ("${shared}"). Update to ${recommended} for ${pick.value}?`,
          { modal: true },
          'Update',
          'Keep current',
          'Clear override (use recommended)'
        );
        if (choice === 'Update') {
          await config.update(
            'model',
            recommended,
            vscode.ConfigurationTarget.Global
          );
          vscode.window.showInformationMessage(
            `Shared model updated to ${recommended}`
          );
        } else if (choice === 'Clear override (use recommended)') {
          await config.update('model', '', vscode.ConfigurationTarget.Global);
          const key =
            pick.value === 'openai'
              ? 'openaiModel'
              : pick.value === 'gemini'
                ? 'geminiModel'
                : 'model';
          if (key !== 'model') {
            await config.update(
              key,
              recommended,
              vscode.ConfigurationTarget.Global
            );
          }
          vscode.window.showInformationMessage(
            `Using recommended ${pick.value} model: ${recommended}`
          );
        }
      }
      refreshStatusItem();
    }
  );

  context.subscriptions.push(
    statusItem,
    modelStatusItem,
    configWatcher,
    setApiKeyCommand,
    showLogsCommand,
    setProviderCommand,
    setModelCommand
  );
  let disposable = vscode.commands.registerCommand(
    'haiku-commit.generate',
    async () => {
      try {
        const gitExtension =
          vscode.extensions.getExtension<GitExtension>('vscode.git');
        const git = gitExtension?.exports?.getAPI(1);

        let targetRepository: GitRepository | undefined;
        let repositoryPath = '';

        let repoDisplayName = '';

        if (git && git.repositories.length > 0) {
          if (git.repositories.length === 1) {
            targetRepository = git.repositories[0];
            repositoryPath = targetRepository.rootUri.fsPath;
            logger.debug(`Using single Git repository: ${repositoryPath}`);
            repoDisplayName =
              vscode.workspace.getWorkspaceFolder(targetRepository.rootUri)
                ?.name ?? path.basename(repositoryPath);
          } else {
            logger.info(
              `Multiple Git repositories detected (${git.repositories.length})`
            );
            const savedRepoPath =
              context.workspaceState.get<string>(LAST_REPO_KEY);
            if (savedRepoPath) {
              const found = git.repositories.find(
                (r) => r.rootUri.fsPath === savedRepoPath
              );
              if (found) {
                targetRepository = found;
                repositoryPath = found.rootUri.fsPath;
                repoDisplayName =
                  vscode.workspace.getWorkspaceFolder(found.rootUri)?.name ??
                  path.basename(repositoryPath);
                logger.info(
                  `Reusing previously selected repository: ${repoDisplayName}`
                );
              }
            }

            if (!targetRepository) {
              const picks: RepoPickItem[] = git.repositories.map((repo) => {
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(
                  repo.rootUri
                );
                const label =
                  workspaceFolder?.name ?? path.basename(repo.rootUri.fsPath);
                const description = workspaceFolder
                  ? path
                      .relative(workspaceFolder.uri.fsPath, repo.rootUri.fsPath)
                      .replace(/\\/g, '/') || '.'
                  : repo.rootUri.fsPath;
                return {
                  label,
                  description,
                  repo,
                };
              });
              const selection = await vscode.window.showQuickPick<RepoPickItem>(
                picks,
                { placeHolder: 'Select repository for Haiku Commit' }
              );
              if (!selection) {
                logger.info('User cancelled repository selection');
                return;
              }
              targetRepository = selection.repo;
              repositoryPath = targetRepository.rootUri.fsPath;
              logger.info(
                `Repository selected: ${selection.label} (${selection.description})`
              );
              repoDisplayName = selection.label;
              await context.workspaceState.update(
                LAST_REPO_KEY,
                repositoryPath
              );
            }
          }
        } else {
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
          if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
          }
          repositoryPath = workspaceFolder.uri.fsPath;
          logger.warn(
            'VS Code Git extension unavailable; using first workspace folder'
          );
          repoDisplayName = workspaceFolder.name;
        }

        if (!repositoryPath) {
          logger.error('Unable to determine repository path for Haiku Commit');
          vscode.window.showErrorMessage(
            'Unable to determine repository for Haiku Commit generation'
          );
          return;
        }

        const repoLabel = repoDisplayName || path.basename(repositoryPath);

        const config = vscode.workspace.getConfiguration(configSection);
        const providerName =
          (config.get<string>('provider', '') as ProviderName) || ('' as any);
        if (!providerName) {
          const chosen = await vscode.window.showWarningMessage(
            'Select a provider to generate haiku?',
            'Choose Provider'
          );
          if (chosen === 'Choose Provider') {
            await vscode.commands.executeCommand('haiku-commit.setProvider');
          }
          return;
        }
        const anthropicKey = config.get<string>('anthropicApiKey') || '';
        const openaiKey = config.get<string>('openaiApiKey') || '';
        const geminiKey = config.get<string>('geminiApiKey') || '';
        let apiKey =
          providerName === 'openai'
            ? openaiKey
            : providerName === 'gemini'
              ? geminiKey
              : anthropicKey;
        const strict575 = config.get<boolean>('strict575', true);
        const maxDiffLength = config.get<number>('maxDiffLength', 4000);
        const samples = Math.min(
          5,
          Math.max(1, config.get<number>('samples', 1))
        );
        const model = effectiveModel(providerName, config);
        if (!model) {
          vscode.window.showWarningMessage(
            'No model resolved for current provider. Set a model or clear shared override.'
          );
          return;
        }
        const maxTokensSetting = config.get<number>('maxTokens', 200);
        const configuredRetries = config.get<number>('maxRetries', 2);
        const maxRetries = Math.max(0, configuredRetries);
        const debug = config.get<boolean>('debug', false);
        debugEnabled = debug;
        logger.info(
          `Generation starting (${samples} sample${
            samples > 1 ? 's' : ''
          }, strict=${strict575}, debug=${debug}, provider=${providerName}, model=${model}, maxTokens=${maxTokensSetting}, maxRetries=${maxRetries})`
        );

        if (!apiKey) {
          const input = await vscode.window.showInputBox({
            prompt:
              providerName === 'openai'
                ? 'Enter your OpenAI API key'
                : providerName === 'gemini'
                  ? 'Enter your Google AI Studio (Gemini) API key'
                  : 'Enter your Anthropic API key',
            password: true,
            placeHolder:
              providerName === 'openai'
                ? 'sk-...'
                : providerName === 'gemini'
                  ? 'AIza...'
                  : 'sk-ant-...',
          });

          if (input) {
            const settingKey =
              providerName === 'openai'
                ? 'openaiApiKey'
                : providerName === 'gemini'
                  ? 'geminiApiKey'
                  : 'anthropicApiKey';
            await config.update(
              settingKey,
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

        let diff: string;
        try {
          diff = await getStagedDiff({
            cwd: repositoryPath,
            maxLength: maxDiffLength,
            logger,
          });
          logger.debug(
            `Staged diff fetched from ${repoLabel} (${diff.length} chars${
              diff.includes('... (truncated)') ? ', truncated' : ''
            })`
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error(`Diff retrieval failed: ${msg}`);
          vscode.window.showErrorMessage(msg);
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Generating haiku commit message…',
            cancellable: true,
          },
          async (_progress, token) => {
            const controller = new AbortController();
            const cancelListener = token.onCancellationRequested(() => {
              logger.warn('Generation cancelled by user');
              controller.abort();
            });

            try {
              const items: { text: string; valid: boolean }[] = [];

              const providerFn = getProvider({
                provider: providerName,
                apiKey,
                model,
                maxTokens: maxTokensSetting,
                logger,
                signal: controller.signal,
              });

              for (let i = 0; i < samples; i++) {
                if (token.isCancellationRequested) {
                  logger.info(
                    'Cancelling before invoking provider due to user request'
                  );
                  return;
                }
                logger.debug(`Sample ${i + 1}/${samples}: invoking provider`);
                try {
                  const result = await generateWithValidation(
                    (extraInstruction?: string) =>
                      providerFn(diff, extraInstruction),
                    { strict: strict575, maxRetries },
                    logger
                  );
                  items.push({ text: result.text, valid: result.valid });
                  logger.debug(
                    `Sample ${i + 1} attempts=${result.attempts}, valid=${
                      result.valid
                    }`
                  );
                } catch (err) {
                  if (token.isCancellationRequested || isAbortError(err)) {
                    logger.info('Generation aborted during provider call');
                    return;
                  }
                  logger.error(
                    `Provider call failed for sample ${i + 1}: ${String(err)}`
                  );
                  showAnthropicError(err);
                  return;
                }
              }

              const insertHaiku = async (haiku: string) => {
                const clean = normalizeHaiku(haiku);
                const repoForInsert =
                  targetRepository ?? git?.repositories?.[0];
                if (repoForInsert) {
                  repoForInsert.inputBox.value = clean;
                  vscode.window.showInformationMessage(
                    'Haiku commit message generated! 🌸'
                  );
                  logger.debug(
                    `Haiku inserted into commit message (${repoLabel})`
                  );
                } else {
                  const action = await vscode.window.showInformationMessage(
                    `Generated Haiku:\n\n${clean}`,
                    'Copy to Clipboard'
                  );
                  if (action === 'Copy to Clipboard') {
                    vscode.env.clipboard.writeText(clean);
                  }
                  logger.debug('Haiku delivered via clipboard fallback');
                }
              };

              if (token.isCancellationRequested) {
                logger.info('Generation cancelled before user selection');
                return;
              }

              if (samples > 1) {
                if (token.isCancellationRequested) {
                  logger.info('Generation cancelled before showing selection');
                  return;
                }
                const pick = await vscode.window.showQuickPick(
                  items.map((it, idx) => {
                    const lines = it.text.split(/\r?\n/);
                    const label = lines[0] || `Haiku ${idx + 1}`;
                    const detail =
                      `${lines[1] ?? ''} / ${lines[2] ?? ''}`.trim();
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
                if (!pick) {
                  logger.debug('User dismissed haiku selection QuickPick');
                  return;
                }
                logger.debug(
                  `Sample selected via QuickPick: index ${items.findIndex(
                    (it) => it.text === (pick as any).value
                  )}`
                );
                if (token.isCancellationRequested) {
                  logger.info('Selection cancelled after picking option');
                  return;
                }
                await insertHaiku((pick as any).value as string);
                return;
              }

              const only = items[0];
              if (strict575 && !only.valid) {
                logger.debug(
                  'Strict mode failed after retries; prompting user'
                );
                if (token.isCancellationRequested) {
                  logger.info('Generation cancelled before strict prompt');
                  return;
                }
                const choice = await vscode.window.showQuickPick(
                  [
                    { label: 'Use best attempt', value: 'use' },
                    { label: 'Try again', value: 'retry' },
                    { label: 'Cancel', value: 'cancel' },
                  ],
                  {
                    placeHolder:
                      'Strict 5-7-5 failed after retries. What next?',
                  }
                );
                if (!choice || choice.value === 'cancel') {
                  logger.debug('User cancelled strict retry prompt');
                  return;
                }
                if (choice.value === 'retry') {
                  try {
                    logger.debug('Retry triggered by user in strict mode');
                    const re = await generateWithValidation(
                      (extraInstruction?: string) =>
                        providerFn(diff, extraInstruction),
                      { strict: true, maxRetries },
                      logger
                    );
                    await insertHaiku(re.text);
                    return;
                  } catch (err) {
                    if (token.isCancellationRequested || isAbortError(err)) {
                      logger.info('Manual retry aborted by user');
                      return;
                    }
                    logger.error(
                      `Provider call failed during manual retry: ${String(err)}`
                    );
                    showAnthropicError(err);
                    return;
                  }
                }
                logger.debug('User accepted best available haiku');
                await insertHaiku(only.text);
                return;
              }

              await insertHaiku(only.text);
            } finally {
              cancelListener.dispose();
            }
          }
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.error(`Unhandled error: ${msg}`);
        vscode.window.showErrorMessage(`Error: ${msg}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
