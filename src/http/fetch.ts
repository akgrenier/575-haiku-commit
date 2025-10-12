import { fetch as undiciFetch, Headers, Request, Response } from 'undici';

// Choose global fetch if available (e.g., newer VS Code runtimes), otherwise fall back to undici.
const runtimeFetch: typeof undiciFetch =
  (globalThis as any).fetch ?? undiciFetch;

export { Headers, Request, Response };
export const fetch = runtimeFetch as unknown as typeof globalThis.fetch;
