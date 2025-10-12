#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { createEngine } from '@secretlint/node';

const run = async () => {
  const cwd = process.cwd();
  const gitLs = await promisify(execFile)('git', ['ls-files'], { cwd });
  const files = gitLs.stdout
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  if (files.length === 0) {
    console.log('No tracked files to scan.');
    return;
  }

  const binaryExtensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.bmp',
    '.webp',
    '.mp4',
    '.mov',
    '.zip',
    '.gz',
    '.7z',
    '.pdf',
  ]);

  const engine = await createEngine({
    cwd,
    formatter: 'stylish',
    configFilePath: path.join(cwd, '.secretlintrc.json'),
  });

  let hasError = false;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.has(ext)) continue;

    const buffer = await readFile(filePath);
    if (buffer.includes(0)) continue; // skip binary-like content

    const { ok, output } = await engine.executeOnContent({
      content: buffer.toString('utf8'),
      filePath,
    });

    if (!ok) {
      hasError = true;
      process.stderr.write(`${output.trim()}\n`);
    }
  }

  if (hasError) {
    process.exitCode = 1;
  } else {
    console.log('Secretlint check passed.');
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(2);
});
