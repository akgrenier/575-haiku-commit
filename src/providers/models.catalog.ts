export default {
  anthropic: [
    {
      id: 'claude-sonnet-4-5-20250929',
      alias: ['claude-sonnet-4-5-20250929', 'claude-sonnet-4-5-latest'],
      label: 'Claude Sonnet 4.5 (latest)',
      recommended: true,
    },
    {
      id: 'claude-sonnet-4-20250514',
      alias: ['claude-sonnet-4-20250514'],
      label: 'Claude Sonnet 4 (preferred)',
      preferred: true,
    },
    {
      id: 'claude-3-5-haiku-20241022',
      alias: ['claude-3-5-haiku-latest'],
      label: 'Claude Haiku 3.5 (fastest)',
    },
  ],
  openai: [
    { id: 'gpt-5-mini-2025-08-07', alias: ['gpt-5-mini'], label: 'GPT-5 Mini 2025-08-07 (preferred)', recommended: true },
    { id: 'gpt-5-2025-08-07', alias: ['gpt-5'], label: 'GPT-5 2025-08-07' },
    { id: 'gpt-5-nano-2025-08-07', alias: ['gpt-5-nano'], label: 'GPT-5 Nano 2025-08-07 (cheapest)' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash-preview-09-2025', alias: ['gemini-2.5-flash'], label: 'Gemini 2.5 Flash Preview (preferred — 1M token context)', recommended: true },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash-lite-preview-09-2025', alias: ['gemini-2.5-flash-lite'], label: 'Gemini 2.5 Flash-Lite Preview (cheapest)' },
  ],
} as const;
