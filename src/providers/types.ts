import type { HaikuLogger } from '../logging';

export type ProviderName = 'anthropic' | 'openai' | 'gemini';

export interface ProviderOptions {
  provider: ProviderName;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  logger?: HaikuLogger;
  signal?: AbortSignal;
}

