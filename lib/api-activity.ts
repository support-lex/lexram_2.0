// Tiny subscribable in-flight-request counter.
//
// Every API entry point (axios + fetch-based lexramRequest + the SSE
// streamLexramQuery) calls begin()/end() around its request lifetime.
// UI components subscribe to render a progress bar (or any indicator)
// whenever count > 0. No external store dep — vanilla pub/sub works fine
// because there's exactly one counter for the whole app.

let count = 0;
const listeners = new Set<(n: number) => void>();

function emit() {
  for (const l of listeners) l(count);
}

export function begin(): void {
  count += 1;
  emit();
}

export function end(): void {
  count = Math.max(0, count - 1);
  emit();
}

export function getCount(): number {
  return count;
}

export function subscribe(listener: (n: number) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
