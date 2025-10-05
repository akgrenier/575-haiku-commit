import * as vscode from 'vscode';

export interface GenerateOptions {
  /** Anthropic API key */
  apiKey: string;
  /** Optional extra instruction appended to the prompt */
  extraInstruction?: string;
  /** Max tokens to request from the API */
  maxTokens?: number;
}

/**
 * Generate a haiku commit message from a git diff using Anthropic Messages API.
 * The function returns a single haiku string with exactly three lines.
 */
export async function generateHaiku(
  diff: string,
  opts: GenerateOptions
): Promise<string> {
  const { apiKey, extraInstruction, maxTokens = 200 } = opts;

  const baseInstruction = [
    'Write a git commit message as a haiku.',
    'Strict 5-7-5 syllables. Exactly 3 lines.',
    'No preamble, no code fences, no extra text.',
    'Avoid trailing spaces; keep lines concise.',
  ].join(' ');

  const instruction = extraInstruction
    ? `${baseInstruction}\n${extraInstruction}`
    : baseInstruction;

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: `${instruction}\n\nGit diff (staged changes):\n${diff}`,
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
      const result = await attempt();
      if (result.ok && typeof result.text === 'string') {
        return result.text.trim();
      }
      if (!transientStatuses.has(result.status)) {
        throw new Error(`Anthropic API error (status ${result.status})`);
      }
      lastError = `Transient Anthropic API error (status ${result.status})`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Treat network or parsing errors as transient for a limited retry.
      lastError = msg;
    }

    if (i < delays.length) {
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }

  const detail = lastError ? `: ${lastError}` : '';
  throw new Error(`Failed to generate haiku from Anthropic${detail}`);
}

/**
 * Utility to surface friendly errors via VS Code UI.
 */
export function showAnthropicError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  vscode.window.showErrorMessage(msg);
}
