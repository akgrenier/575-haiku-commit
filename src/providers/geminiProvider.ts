import { fetch } from '../http/fetch';
import type { HaikuLogger } from '../logging';
import { buildUserPrompt } from '../prompt/haiku';

export interface GenerateOptions {
  apiKey: string;
  extraInstruction?: string;
  maxTokens?: number; // not all Gemini models honor this the same way
  logger?: HaikuLogger;
  signal?: AbortSignal;
  model?: string;
}

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
    model = 'gemini-2.5-flash',
  } = opts;

  logger?.debug(
    `[gemini] preparing request (model=${model}, diffLength=${diff.length}, maxTokens=${maxTokens}, corrective=${Boolean(
      extraInstruction
    )})`
  );

  const text = buildUserPrompt(diff, extraInstruction);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const attempt = async (): Promise<{ ok: boolean; status: number; text?: string }> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
      }),
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const data = (await response.json()) as any;
    const out: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { ok: true, status: 200, text: String(out).trim() };
  };

  const transientStatuses = new Set([429, 500, 502, 503, 504]);
  const delays = [250, 600];
  let lastError: string | undefined;

  for (let i = 0; i <= delays.length; i++) {
    try {
      logger?.debug(`[gemini] request attempt ${i + 1}`);
      const result = await attempt();
      if (result.ok && typeof result.text === 'string') {
        logger?.debug(`[gemini] success on attempt ${i + 1} (len=${result.text.length})`);
        return result.text.trim();
      }
      if (!transientStatuses.has(result.status)) {
        logger?.warn(`[gemini] non-retryable status ${result.status} terminating`);
        throw new Error(`Gemini API error (status ${result.status})`);
      }
      lastError = `Transient Gemini API error (status ${result.status})`;
      logger?.warn(`[gemini] ${lastError}`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger?.info('[gemini] request aborted by caller');
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      logger?.warn(`[gemini] transient failure: ${msg}`);
    }

    if (i < delays.length) {
      const delay = delays[i];
      logger?.debug(`[gemini] retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const detail = lastError ? `: ${lastError}` : '';
  logger?.error(`Failed to generate haiku from Gemini${detail}`);
  throw new Error(`Failed to generate haiku from Gemini${detail}`);
}
