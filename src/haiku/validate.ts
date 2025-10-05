// Robust loading for 'syllable' across CJS/ESM shapes with a safe fallback
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _syllableImport: any = (() => {
  try {
    return require('syllable');
  } catch {
    return undefined;
  }
})();

const syllableFn: ((text: string) => number) | undefined =
  typeof _syllableImport === 'function'
    ? _syllableImport
    : typeof _syllableImport?.default === 'function'
      ? _syllableImport.default
      : typeof _syllableImport?.syllable === 'function'
        ? _syllableImport.syllable
        : undefined;

function heuristicSyllableCount(text: string): number {
  const word = (text || '').toLowerCase().replace(/[^a-z\s]/g, '');
  const words = word.split(/\s+/).filter(Boolean);
  let total = 0;
  for (const w of words) {
    let count = (w.match(/[aeiouy]+/g) || []).length;
    if (w.endsWith('e')) count = Math.max(1, count - 1);
    if (count === 0) count = 1;
    total += count;
  }
  return total;
}

function countSyllables(text: string): number {
  try {
    if (syllableFn) return syllableFn(text);
  } catch {
    // fall back to heuristic
  }
  return heuristicSyllableCount(text);
}

/** Normalize a haiku: trim outer whitespace and trailing spaces on each line. */
export function normalizeHaiku(text: string): string {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(0, 3)
    .map((l) => l.replace(/\s+$/u, ''))
    .join('\n');
}

/** Return syllable counts for the first three lines of text. */
export function haikuSyllableCounts(
  text: string
): [number, number, number] | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 3) return null;
  const [a, b, c] = lines;
  return [countSyllables(a), countSyllables(b), countSyllables(c)];
}

/** Check if the text is exactly 3 lines with strict 5-7-5 syllable counts. */
export function isStrict575(text: string): boolean {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length !== 3) return false;
  const counts = haikuSyllableCounts(text);
  if (!counts) return false;
  const [a, b, c] = counts;
  return a === 5 && b === 7 && c === 5;
}

export interface RetryResult {
  text: string;
  valid: boolean;
  attempts: number;
}

export interface RetryOptions {
  /** Enforce strict 5-7-5; if false, returns after first attempt. */
  strict: boolean;
  /** Maximum corrective retries after the first attempt. */
  maxRetries: number; // recommended 2
}

/**
 * Calls the provided generator and validates the result against 5-7-5.
 * If invalid and strict=true, re-prompts up to maxRetries with a corrective instruction.
 */
export async function generateWithValidation(
  generator: (extraInstruction?: string) => Promise<string>,
  options: RetryOptions
): Promise<RetryResult> {
  const { strict, maxRetries } = options;

  const corrective =
    'The previous output did not match strict 5-7-5. Output exactly 3 lines with syllable counts 5, 7, 5. No extra text, no code fences.';

  // First attempt
  let text = normalizeHaiku(await generator());
  if (!strict) return { text, valid: true, attempts: 1 };

  if (isStrict575(text)) return { text, valid: true, attempts: 1 };

  // Corrective retries
  let attempts = 1;
  for (let i = 0; i < maxRetries; i++) {
    attempts++;
    text = normalizeHaiku(await generator(corrective));
    if (isStrict575(text)) {
      return { text, valid: true, attempts };
    }
  }

  return { text, valid: false, attempts };
}
