const dotenv = require('dotenv');

const ENV_VAR_PATTERN = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;

function expandEnvValue(rawValue, env) {
  return rawValue.replace(ENV_VAR_PATTERN, (match, braced, bare) => {
    const key = braced || bare || '';
    return env[key] === undefined ? match : env[key];
  });
}

const result = dotenv.config();
if (result.parsed) {
  for (const key of Object.keys(result.parsed)) {
    if (process.env[key] !== undefined) {
      process.env[key] = expandEnvValue(process.env[key], process.env);
    }
  }
}
