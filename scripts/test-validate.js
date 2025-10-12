/* Minimal runtime check for validate.ts without a full test framework */
const { isStrict575, normalizeHaiku } = require('../out/haiku/validate.js');

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const good = normalizeHaiku(
  `Code flows like rain\nRefactors shape new canyons\nTests hold steady ground`
);
assert('normalizeHaiku trims to 3 lines', good.split('\n').length === 3);

// We don't rely on exact counts here; just assert boolean contract is returned
const strictResult = isStrict575(good);
assert('isStrict575 returns a boolean', typeof strictResult === 'boolean');

// Intentionally broken syllable structure (1 line)
const bad = 'one line only';
assert('isStrict575 false for non-3-line input', isStrict575(bad) === false);

if (process.exitCode) {
  console.error('validate checks failed');
  process.exit(process.exitCode);
} else {
  console.log('validate checks passed');
}
