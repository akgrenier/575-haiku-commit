import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import type { HaikuLogger } from '../logging';

const execFileAsync = promisify(execFile);

export interface DiffOptions {
  /** Absolute path to the workspace folder (git repo root or subfolder). */
  cwd: string;
  /** Maximum number of characters to keep from the diff. */
  maxLength: number;
  /** Optional logger for diagnostic output. */
  logger?: HaikuLogger;
}

/**
 * Returns the staged git diff for the current workspace. Truncates large diffs.
 * Throws with a friendly message if git is unavailable or the folder is not a repo.
 */
export async function getStagedDiff(opts: DiffOptions): Promise<string> {
  const { cwd, maxLength, logger } = opts;
  try {
    // Ensure we are inside a git repository
    await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Not a git repository or git not available: ${message}`);
  }

  // Stream staged diff to avoid maxBuffer limits
  const diff = await new Promise<string>((resolve, reject) => {
    const child = spawn('git', ['diff', '--cached'], { cwd });
    let output = '';
    let truncated = false;

    child.stdout.on('data', (chunk: Buffer) => {
      if (truncated) return; // already truncated and terminating
      const text = chunk.toString('utf8');
      const remaining = maxLength - output.length;
      if (remaining > 0) {
        output += text.slice(0, Math.max(0, remaining));
      }
      if (output.length >= maxLength) {
        truncated = true;
        output = output.slice(0, maxLength) + '\n... (truncated)';
        logger?.info(
          `Diff over ${maxLength} characters truncated for safety`
        );
        // Stop the git process to avoid further buffering
        try {
          child.kill();
        } catch {}
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      // Collect minimal stderr; ignore unless process fails
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      // If we killed due to truncation, treat as success
      if (truncated) return resolve(output);
      if (code !== 0) return reject(new Error('Failed to read staged diff'));
      resolve(output);
    });
  });

  if (!diff.trim()) {
    logger?.debug('No staged diff detected before validation error');
    throw new Error(
      'No staged changes found. Please stage your changes first.'
    );
  }

  logger?.debug('Staged diff ready for provider');
  return diff;
}
