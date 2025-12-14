# Guide 05 — Provider architecture (registry + retries + error mapping)

This guide is about designing the part of your extension that talks to external services (LLMs, APIs, whatever) without turning your `extension.ts` into spaghetti.

This repo is a great example because it supports **multiple providers** (Anthropic / OpenAI / Gemini) behind one interface.

## The goal

You want:

- a **single call site** (“generate something from input X”)
- a **registry** that selects the right implementation based on settings
- consistent **retries/backoff** for transient failures
- consistent **error mapping** (friendly UI message + useful logs)

## Part A — The registry pattern (how this repo does it)

### 1) Define a tiny provider interface

In this repo, the extension uses a single function shape:

- `(diff: string, extraInstruction?: string) => Promise<string>`

That’s the “provider contract”.

### 2) Build providers via a registry

`src/providers/registry.ts` defines a `registry` that maps provider names to builders:

- each builder closes over shared options (`apiKey`, `model`, `maxTokens`, `logger`, `signal`)
- the returned function only needs the input (`diff`, `extraInstruction`)

This is the key win: **`extension.ts` doesn’t care which provider is used.**

## Copy this pattern (provider registry)

This is the essence of what `src/providers/registry.ts` + `src/providers/index.ts` are doing:

```ts
export type ProviderName = 'a' | 'b';

export type ProviderFn = (input: string, extraInstruction?: string) => Promise<string>;

export type ProviderBuilder = (opts: {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
  logger?: { debug: (s: string) => void; warn: (s: string) => void; error: (s: string) => void };
}) => ProviderFn;

const registry: Record<ProviderName, ProviderBuilder> = {
  a: (opts) => async (input, extra) => {
    // call Provider A using opts + input + extra
    return '...';
  },
  b: (opts) => async (input, extra) => {
    // call Provider B using opts + input + extra
    return '...';
  },
};

export function getProvider(name: ProviderName, opts: Parameters<ProviderBuilder>[0]): ProviderFn {
  const builder = registry[name];
  if (!builder) throw new Error(`Provider "${name}" not implemented`);
  return builder(opts);
}
```

### 3) `getProvider()` is the single import surface

`src/providers/index.ts` exposes `getProvider(opts)`:

- validates provider name
- returns a provider function (or a function that throws a helpful error)

If you’re building your own extension: keep your “provider selection logic” here, not scattered through command handlers.

### In this repo: follow the flow end-to-end

To understand the full provider call path in *this* codebase, open these in order:

1. `src/extension.ts`
   - Search for `getProvider({` to see the single call site.
2. `src/providers/index.ts`
   - `getProvider(opts)` selects a builder (or returns a function that throws a helpful message).
3. `src/providers/registry.ts`
   - the `registry` maps `'anthropic' | 'openai' | 'gemini'` to concrete implementations.
4. Provider implementations:
   - `src/providers/anthropicProvider.ts`
   - `src/providers/openaiProvider.ts`
   - `src/providers/geminiProvider.ts`

Optional supporting piece:

- `src/http/fetch.ts` (thin wrapper selecting global `fetch` if available, else `undici`)

## Part B — Retries/backoff (how to not get paged at 2am)

All three providers in this repo use the same simple retry strategy:

- treat `429, 500, 502, 503, 504` as transient
- retry a couple times with small delays (`250ms`, `600ms`)
- treat network/parse errors as transient (limited retries)
- respect `AbortError` (cancellation)

This is the correct baseline for interactive UX:

- enough retries to ride out hiccups
- not so many retries that the UI feels hung

### A “steal this” retry helper (recommended refactor pattern)

Right now, each provider duplicates retry logic. In your own extension, you’ll want a shared helper, conceptually like:

```ts
type AttemptResult<T> = { ok: true; value: T } | { ok: false; status?: number; error?: string };

export async function withRetries<T>(
  label: string,
  attempt: (tryIndex: number) => Promise<AttemptResult<T>>,
  opts: {
    transientStatuses: Set<number>;
    delaysMs: number[];
    logger?: { debug: (s: string) => void; warn: (s: string) => void; error: (s: string) => void };
    signal?: AbortSignal;
  }
): Promise<T> {
  // pseudo: loop attempts, handle AbortError, sleep between retries, throw final error
  throw new Error('example');
}
```

You don’t need fancy exponential backoff to ship; you do need **consistency**.

## Part C — Error mapping (developer logs vs human messages)

### 1) Separate “UI errors” from “debug detail”

Best practice:

- **User-facing**: “OpenAI request failed (429). Try again in a minute.”
- **Logs**: include provider, model, status, request attempt number, and *safe* context (diff length, not diff contents).

This repo logs things like:

- provider label
- model
- diff length
- attempt number

That’s the right idea: it’s actionable without leaking code.

### 2) Normalize errors into a small set of types

If you’re building this pattern into your own extension, normalize everything to something like:

- `MissingApiKey`
- `AuthError` (401/403)
- `RateLimitError` (429)
- `TransientNetworkError`
- `ProviderResponseError` (unexpected shape)
- `UserCancelled` (`AbortError` / cancellation)

Then your command handler can do a simple switch and show a good message.

### 3) This repo’s current “error mapping” (and what to improve)

Today:

- provider functions throw `Error(...)` with a provider-specific string
- `extension.ts` calls `showAnthropicError(err)` on provider failure (even for non-Anthropic providers)

For a learning repo, that’s a teachable moment:

- keep UI error helpers provider-agnostic (e.g. `showProviderError(provider, err)`)
- or move the UI mapping into the command handler (preferred), using normalized error types

## Try it (repo exercise)

1. Open `src/providers/openaiProvider.ts` and find the `transientStatuses` set.
2. Add a temporary log line for the non-retryable branch (do **not** include secrets), then run the extension and provoke a failure (e.g., set an invalid key).
3. Watch how:
   - the provider throws
   - `extension.ts` logs it
   - the UI surfaces an error

## Part D — Adding a new provider (how you replicate this repo)

Checklist:

1. Create `src/providers/<newProvider>.ts` with a `generateHaiku()` that:
   - accepts `{ apiKey, model, maxTokens, logger, signal, extraInstruction }`
   - calls your API
   - parses the response into a string
   - uses the shared retry helper
2. Add the provider name to `ProviderName` in `src/providers/types.ts`
3. Add it to `registry` in `src/providers/registry.ts`
4. Update settings (`package.json` schema) and any provider picker UI
5. Update docs (and ideally add a smoke test or a “models” script update)

## “Steal this architecture” checklist

- One provider interface; one call site.
- Registry is the only place that knows “provider name → implementation”.
- Retries are centralized and consistent.
- Errors are normalized (human message + useful logs).
- Cancellation (`AbortSignal`) is supported end-to-end.

## Next guide

Two natural follow-ups:

- **Prompt + validation** (deterministic constraints + corrective retries)
  - [`docs/guides/06-prompt-and-validation.md`](./06-prompt-and-validation.md)
- **Diagnostics** (output channel patterns, debug flags, redaction rules)

## Further reading

- Anthropic Messages API — `https://docs.anthropic.com/`
- OpenAI Responses API — `https://platform.openai.com/docs/`
- Gemini API — `https://ai.google.dev/`


