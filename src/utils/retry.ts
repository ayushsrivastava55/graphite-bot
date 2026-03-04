import { log } from './logger.js';

export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000,
  label = 'operation',
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        log.warn(`${label} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
