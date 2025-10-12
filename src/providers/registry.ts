import { generateHaiku as anthropicGenerate } from './anthropicProvider';
import { generateHaiku as openaiGenerate } from './openaiProvider';
import { generateHaiku as geminiGenerate } from './geminiProvider';
import type { ProviderName, ProviderOptions } from './types';

export type ProviderBuilder = (
  opts: ProviderOptions
) => (diff: string, extraInstruction?: string) => Promise<string>;

export const registry: Record<ProviderName, ProviderBuilder> = {
  anthropic: (opts) => (diff: string, extraInstruction?: string) =>
    anthropicGenerate(diff, {
      apiKey: opts.apiKey,
      extraInstruction,
      maxTokens: opts.maxTokens,
      logger: opts.logger,
      signal: opts.signal,
      model: opts.model,
    }),
  openai: (opts) => (diff: string, extraInstruction?: string) =>
    openaiGenerate(diff, {
      apiKey: opts.apiKey,
      extraInstruction,
      maxTokens: opts.maxTokens,
      logger: opts.logger,
      signal: opts.signal,
      model: opts.model,
    }),
  gemini: (opts) => (diff: string, extraInstruction?: string) =>
    geminiGenerate(diff, {
      apiKey: opts.apiKey,
      extraInstruction,
      maxTokens: opts.maxTokens,
      logger: opts.logger,
      signal: opts.signal,
      model: opts.model,
    }),
};

