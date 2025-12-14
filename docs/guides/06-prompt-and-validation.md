# Guide 06 — Prompt + validation (constraints + tests)

This guide is about the unglamorous part of building AI-powered extensions:

- getting the model to output the **shape** you need
- **validating** it deterministically
- retrying with a **corrective prompt** (without turning into an infinite loop)
- writing **tests** that don’t depend on the model behaving today

In this repo, the “shape” is a haiku:

- **exactly 3 lines**
- strict **5–7–5** syllable counts (optional)
- no preamble, no code fences, no extra text

## Part A — The prompt contract (tell the model what “success” is)

The prompt builder is in `src/prompt/haiku.ts`.

Key idea: make the “contract” explicit:

- “Strict 5-7-5 syllables. Exactly 3 lines.”
- “No preamble, no code fences, no extra text.”

Then include the actual input (here: the staged diff) under a clear label:

- `Git diff (staged changes):\n${diff}`

### Why this matters

When you’re doing UX automation (writing to the SCM commit box), you need output that’s:

- predictable
- minimal
- safe to insert

Your prompt is step 1. But prompts are not enforcement — which leads to validation.

## Part B — Normalize first (reduce variance before validating)

Before validating, normalize. This repo does:

- trim outer whitespace
- split into lines
- take the first 3 lines
- remove trailing spaces on each line

Normalization lives in `normalizeHaiku()` in `src/haiku/validate.ts`.

### Why normalize?

You don’t want strict checks to fail because of:

- an extra trailing newline
- a fourth “bonus” line
- random whitespace

Normalize to the exact shape you want to validate.

## Part C — Deterministic validation (no model vibes allowed)

Validation in this repo is:

- `isStrict575(text)` → `boolean`
- checks: **exactly 3 lines** AND syllable counts **5-7-5**

Syllables are counted using the `syllable` package when available, and a heuristic fallback otherwise.

### Teachably important constraint

LLMs are probabilistic. Your checks can’t be.

If your extension behavior depends on the output shape (it does), you need a deterministic validator that:

- is stable
- is testable
- fails loudly in logs

## Part D — Corrective retries (the “ask again, smarter” loop)

The core loop is `generateWithValidation()` in `src/haiku/validate.ts`.

Flow:

1. Generate once
2. Normalize
3. Validate
4. If `strict=false`: return immediately (still report whether it’s valid)
5. If `strict=true` and invalid: re-run the generator with an extra instruction:
   - “The previous output did not match strict 5-7-5…”
6. Stop after `maxRetries` corrective attempts

Key design choices to copy:

- **bounded retries** (no infinite loops)
- **clear corrective instruction** (it references the failure)
- returns `{ text, valid, attempts }` so UX can decide what to do next

## Part E — Tests (validate without needing the model)

This repo uses a deliberately lightweight approach:

- `scripts/test-validate.js` loads the compiled validator from `out/`
- asserts basic behavioral contracts:
  - normalization returns 3 lines
  - `isStrict575` returns a boolean
  - non-3-line input returns false

It’s not fancy — but it’s the right testing philosophy:

- test the deterministic parts
- don’t write brittle tests that depend on model output

### How you can expand testing (recommended)

If you replicate this pattern in your extension:

- add a table of inputs/expected outputs for `normalize*` helpers
- add explicit validators for “wrong shape” cases
- if you have a parser, fuzz it (malformed JSON, missing fields, etc.)

## “Steal this architecture” checklist

- Prompt defines the contract, but validation enforces it.
- Normalize output before validating.
- Use bounded corrective retries.
- Keep validators deterministic and testable.
- Test the deterministic logic without calling the model.

## Next guide

Two natural follow-ups after prompts + validation:

- **Diagnostics** (output channel, redaction rules, and how to make bug reports reproducible)
- **Release discipline** (preflight checks, packaging, and CI-ish validation)


