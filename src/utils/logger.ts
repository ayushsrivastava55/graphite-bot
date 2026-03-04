const levels = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type Level = keyof typeof levels;

const currentLevel: Level = (process.env.LOG_LEVEL as Level) || 'info';

function fmt(level: Level, msg: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

function shouldLog(level: Level): boolean {
  return levels[level] <= levels[currentLevel];
}

export const log = {
  info(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) console.log(fmt('info', msg, meta));
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(fmt('warn', msg, meta));
  },
  error(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('error')) console.error(fmt('error', msg, meta));
  },
  debug(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) console.log(fmt('debug', msg, meta));
  },
};
