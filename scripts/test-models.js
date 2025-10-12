/* Minimal tests for models helpers without a full test framework */
const {
  effectiveModel,
  getRecommendedModel,
  DEFAULT_MODELS,
} = require('../out/providers/models.js');

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function fakeConfig(values) {
  return {
    get(key, fallback) {
      return values.hasOwnProperty(key) ? values[key] : fallback;
    },
  };
}

// getRecommendedModel should return a catalog value
const recAnthropic = getRecommendedModel('anthropic');
assert('getRecommendedModel anthropic returns a string', typeof recAnthropic === 'string' && recAnthropic.length > 0);

// effectiveModel precedence: shared override wins
let cfg = fakeConfig({ model: 'SHARED-X' });
assert('effectiveModel uses shared override for openai', effectiveModel('openai', cfg) === 'SHARED-X');
assert('effectiveModel uses shared override for gemini', effectiveModel('gemini', cfg) === 'SHARED-X');

// If shared empty, provider-specific model used
cfg = fakeConfig({ model: '', openaiModel: 'OPENAI-Y' });
assert('effectiveModel uses provider-specific for openai', effectiveModel('openai', cfg) === 'OPENAI-Y');

// If none set, built-in default used
cfg = fakeConfig({ model: '' });
assert('effectiveModel falls back to default for gemini', effectiveModel('gemini', cfg) === DEFAULT_MODELS.gemini);

if (process.exitCode) {
  console.error('models tests failed');
  process.exit(process.exitCode);
} else {
  console.log('models tests passed');
}

