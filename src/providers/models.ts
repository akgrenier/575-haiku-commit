import * as vscode from 'vscode';
import type { ProviderName } from './types';
import catalog from './models.catalog';

type CatalogItem = {
  id: string;
  label?: string;
  alias?: ReadonlyArray<string> | string[];
  recommended?: boolean;
  preferred?: boolean;
};
type Catalog = Record<string, ReadonlyArray<CatalogItem>>;

const typedCatalog: Catalog = catalog as unknown as Catalog;

function recommendedFor(provider: ProviderName): string {
  const items = typedCatalog[provider] || [];
  const rec = items.find((m) => m.recommended) || items[0];
  return rec?.id || '';
}

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: recommendedFor('anthropic') || 'claude-sonnet-4-20250514',
  openai: recommendedFor('openai') || 'gpt-5-mini',
  gemini: recommendedFor('gemini') || 'gemini-2.5-flash',
};

export function effectiveModel(
  provider: ProviderName,
  config: vscode.WorkspaceConfiguration
): string {
  const shared = (config.get<string>('model', '') || '').trim();
  if (shared) return shared;
  switch (provider) {
    case 'openai':
      return config.get<string>('openaiModel', DEFAULT_MODELS.openai);
    case 'gemini':
      return config.get<string>('geminiModel', DEFAULT_MODELS.gemini);
    case 'anthropic':
      return DEFAULT_MODELS.anthropic;
    default:
      // Unknown or unset provider; no effective model
      return '';
  }
}

export function getCatalog() {
  return typedCatalog;
}

export function getRecommendedModel(provider: ProviderName): string {
  return recommendedFor(provider);
}
