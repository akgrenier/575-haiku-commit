import { fetch } from '../http/fetch';
import type { HaikuLogger } from '../logging';
import { buildUserPrompt } from '../prompt/haiku';

export interface GenerateOptions {
  apiKey: string;
  extraInstruction?: string;
  maxTokens?: number;
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
    model = 'gpt-5-mini',
  } = opts;

  logger?.debug(
    `[openai] preparing request (model=${model}, diffLength=${diff.length}, maxTokens=${maxTokens}, corrective=${Boolean(
      extraInstruction
    )})`
  );

  const content = buildUserPrompt(diff, extraInstruction);

  const extractResponseText = (d: any): string => {
    if (typeof d?.output_text === 'string' && d.output_text.trim()) {
      return d.output_text;
    }
    const texts: string[] = [];
    const pushText = (t: any) => {
      if (!t) return;
      if (typeof t === 'string') texts.push(t);
      else if (typeof t.text === 'string') texts.push(t.text);
      else if (Array.isArray(t)) {
        for (const x of t) pushText(x);
      } else if (typeof t === 'object') {
        if (typeof t.content === 'string') texts.push(t.content);
        if (Array.isArray(t.content)) for (const c of t.content) pushText(c);
      }
    };
    if (Array.isArray(d?.output)) {
      for (const item of d.output) {
        pushText(item);
        if (Array.isArray((item as any)?.content)) {
          for (const c of (item as any).content) pushText(c);
        }
      }
    }
    if (Array.isArray(d?.content)) {
      for (const c of d.content) pushText(c);
    }
    return texts.join('\n').trim();
  };

  const attempt = async (): Promise<{ ok: boolean; status: number; text?: string }> => {
    const responsesRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model,
        input: content,
        max_output_tokens: maxTokens,
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
      }),
    });

    if (!responsesRes.ok) {
      return { ok: false, status: responsesRes.status };
    }
    const rData = (await responsesRes.json()) as any;
    const text = String(extractResponseText(rData)).trim();
    return { ok: true, status: 200, text };
  };

  const transientStatuses = new Set([429, 500, 502, 503, 504]);
  const delays = [250, 600];
  let lastError: string | undefined;

  for (let i = 0; i <= delays.length; i++) {
    try {
      logger?.debug(`[openai] request attempt ${i + 1}`);
      const result = await attempt();
      if (result.ok && typeof result.text === 'string') {
        logger?.debug(`[openai] success on attempt ${i + 1} (len=${result.text.length})`);
        return result.text.trim();
      }
      if (!transientStatuses.has(result.status)) {
        logger?.warn(`[openai] non-retryable status ${result.status} terminating`);
        throw new Error(`OpenAI API error (status ${result.status})`);
      }
      lastError = `Transient OpenAI API error (status ${result.status})`;
      logger?.warn(`[openai] ${lastError}`);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger?.info('[openai] request aborted by caller');
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      lastError = msg;
      logger?.warn(`[openai] transient failure: ${msg}`);
    }

    if (i < delays.length) {
      const delay = delays[i];
      logger?.debug(`[openai] retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  const detail = lastError ? `: ${lastError}` : '';
  logger?.error(`Failed to generate haiku from OpenAI${detail}`);
  throw new Error(`Failed to generate haiku from OpenAI${detail}`);
}
