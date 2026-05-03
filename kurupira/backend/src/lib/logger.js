const SERVICE = process.env.SERVICE_NAME || 'kurupira';
const isDev = process.env.NODE_ENV !== 'production';

function write(level, msg, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    msg,
    ...(meta && typeof meta === 'object' ? meta : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

// In dev, fall back to readable console output
const logger = isDev
  ? {
      info:  (msg, meta) => console.log(`[${SERVICE}] ${msg}`, meta ?? ''),
      warn:  (msg, meta) => console.warn(`[${SERVICE}] ${msg}`, meta ?? ''),
      error: (msg, meta) => console.error(`[${SERVICE}] ${msg}`, meta ?? ''),
      debug: (msg, meta) => console.debug(`[${SERVICE}] ${msg}`, meta ?? ''),
    }
  : {
      info:  (msg, meta) => write('info',  msg, meta),
      warn:  (msg, meta) => write('warn',  msg, meta),
      error: (msg, meta) => write('error', msg, meta),
      debug: (msg, meta) => write('debug', msg, meta),
    };

module.exports = logger;
