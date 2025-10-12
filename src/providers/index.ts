import type { ProviderName, ProviderOptions } from './types';
import { registry } from './registry';

export type { ProviderName } from './types';

export function getProvider(opts: ProviderOptions) {
  if (!opts.provider) {
    return async () => {
      throw new Error(
        'No AI provider configured. Please set a provider in settings.'
      );
    };
  }
  const name = opts.provider as ProviderName;
  const builder = registry[name];
  if (!builder) {
    return async () => {
      throw new Error(
        `Provider "${String(opts.provider)}" is not implemented.`
      );
    };
  }
  return builder(opts);
}
