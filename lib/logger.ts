export function log(...args: unknown[]) {
  console.log('[LexRam]', ...args);
}

export function logDbError(...args: unknown[]) {
  console.error('[LexRam DB]', ...args);
}
