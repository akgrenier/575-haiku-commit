const BASE_INSTRUCTION = [
  'Write a git commit message as a haiku.',
  'Strict 5-7-5 syllables. Exactly 3 lines.',
  'No preamble, no code fences, no extra text.',
  'Avoid trailing spaces; keep lines concise.',
].join(' ');

export function buildBaseInstruction(): string {
  return BASE_INSTRUCTION;
}

export function buildUserPrompt(
  diff: string,
  extraInstruction?: string
): string {
  const instruction = extraInstruction
    ? `${BASE_INSTRUCTION}\n${extraInstruction}`
    : BASE_INSTRUCTION;
  return `${instruction}\n\nGit diff (staged changes):\n${diff}`;
}

