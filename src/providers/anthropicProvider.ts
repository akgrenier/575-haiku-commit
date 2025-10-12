import * as vscode from 'vscode';
import { fetch } from '../http/fetch';
import type { HaikuLogger } from '../logging';
import { buildUserPrompt } from '../prompt/haiku';

export interface GenerateOptions {
  /** Anthropic API key */
  apiKey: string;
  /** Optional extra instruction appended to the prompt */
  extraInstruction?: string;
  /** Max tokens to request from the API */
  maxTokens?: number;
  /** Optional logger for diagnostics */
  logger?: HaikuLogger;
  /** Allows callers to abort the underlying request. */
  signal?: AbortSignal;
  /** Model identifier to request from Anthropic. */
  model?: string;
}

/**
 * Generate a haiku commit message from a git diff using Anthropic Messages API.
 * The function returns a single haiku string with exactly three lines.
 */
export async function generateHaiku(
  diff: string,
  opts: GenerateOptions
): Promise<string> {
  const {
    apiKey,
    extraInstruction,
    maxTokens = 200,
    logger,
    signal,
    model = 'claude-sonnet-4-20250514',
  } = opts;

  logger?.debug(
    `[anthropic] preparing request (model=${model}, diffLength=${diff.length}, maxTokens=${maxTokens}, corrective=${Boolean(extraInstruction)})`
  );

  const content = buildUserPrompt(diff, extraInstruction);

  const body = {
    model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  } as const;

  const attempt = async (): Promise<{
    ok: boolean;
    status: number;
    text?: string;
  }> => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };
    const text = data?.content?.[0]?.text ?? '';
    return { ok: true, status: 200, text };
  };

  // Basic backoff for transient failures
  const transientStatuses = new Set([429, 500, 502, 503, 504]);
  const delays = [250, 600]; // ms
  let lastError: string | undefined;

  for (let i = 0; i <= delays.length; i++) {
    try {
      logger?.debug(`[anthropic] request attempt ${i + 1}`);
      const result = await attempt();
      if (result.ok && typeof result.text === 'string') {
        logger?.debug(`[anthropic] success on attempt ${i + 1}`);
        return result.text.trim();
      }
      if (!transientStatuses.has(result.status)) {
        logger?.warn(
          `[anthropic] non-retryable status ${result.status} terminating`
        );
        throw new Error(`Anthropic API error (status ${result.status})`);
      }
      lastError = `Transient Anthropic API error (status ${result.status})`;
      logger?.warn(`[anthropic] ${lastError}`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger?.info('[anthropic] request aborted by caller');
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      // Treat network or parsing errors as transient for a limited retry.
      lastError = msg;
      logger?.warn(`[anthropic] transient failure: ${msg}`);
    }

    if (i < delays.length) {
      const delay = delays[i];
      logger?.debug(`[anthropic] retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const detail = lastError ? `: ${lastError}` : '';
  logger?.error(`Failed to generate haiku from Anthropic${detail}`);
  throw new Error(`Failed to generate haiku from Anthropic${detail}`);
}

/**
 * Utility to surface friendly errors via VS Code UI.
 */
export function showAnthropicError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  vscode.window.showErrorMessage(msg);
}
