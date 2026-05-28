// Credit / billing module.
//
// For the demo, balances and transactions live in the browser's localStorage,
// keyed by Supabase user id. The methods are intentionally shaped like REST
// endpoints (`getBalance`, `deduct`, `listTransactions`) so production swap
// is one import change — replace `billingApi` with a fetch-backed client and
// the call sites stay identical.

export const STARTING_BALANCE = 500;

const TESTING_HOSTNAME = "lexram-2-0-ui.vercel.app";

// On lexram-2-0-ui.vercel.app (the test environment) credits are unlimited —
// deductions are no-ops and balance always reads as STARTING_BALANCE.
function isUnlimitedMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === TESTING_HOSTNAME;
}

/**
 * Returns true on production (lexram.ai) and staging (dev-lexram.vercel.app).
 * Returns false on the testing environment (lexram-2-0-ui.vercel.app), where
 * paywall UI and credits should be hidden entirely.
 */
export function isPaywallEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.location.hostname !== TESTING_HOSTNAME;
}

export type BillingMode = "instant" | "deep" | "draft";

export interface RateCard {
  /** Flat credit cost charged per request, regardless of tokens. */
  baseCost: number;
  /** Credits per output token. */
  costPerToken: number;
}

/**
 * Per-mode rate card. Tuned so the starting 500 credits maps roughly to:
 *   - 5 short Instant queries, OR
 *   - 2 mid-length Deep queries, OR
 *   - 1 small Draft.
 *
 * The numbers below are the same shape a real billing service would publish
 * (base fee + per-token fee). Tweak in one place to retune the demo.
 */
export const RATE_CARD: Record<BillingMode, RateCard> = {
  instant: { baseCost: 30, costPerToken: 0.05 },
  deep:    { baseCost: 80, costPerToken: 0.15 },
  draft:   { baseCost: 100, costPerToken: 0.20 },
};

export interface DeductInput {
  mode: BillingMode;
  /** Estimated output tokens consumed by the AI for this response. */
  outputTokens: number;
}

export interface DeductResult {
  cost: number;
  balanceBefore: number;
  balanceAfter: number;
  /** True when this deduction emptied (or would have emptied) the balance. */
  exhausted: boolean;
}

export interface Transaction {
  id: string;
  mode: BillingMode;
  outputTokens: number;
  cost: number;
  balanceAfter: number;
  createdAt: string;
}

const STORAGE_PREFIX = "lexram_credits";
const TX_PREFIX = "lexram_credit_tx";
const TX_HISTORY_LIMIT = 50;

function balanceKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}
function txKey(userId: string): string {
  return `${TX_PREFIX}:${userId}`;
}

function readNumber(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* quota / disabled storage — silent */
  }
}

function readTransactions(userId: string): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(txKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch {
    return [];
  }
}

function writeTransactions(userId: string, txs: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(txKey(userId), JSON.stringify(txs.slice(0, TX_HISTORY_LIMIT)));
  } catch {
    /* noop */
  }
}

function generateTxId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `tx_${crypto.randomUUID()}`;
  }
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const billingApi = {
  /**
   * GET /api/billing/balance — returns the user's current credit balance.
   * First-time callers are auto-issued the STARTING_BALANCE.
   */
  getBalance(userId: string): number {
    if (isUnlimitedMode()) return STARTING_BALANCE;
    const stored = readNumber(balanceKey(userId));
    if (stored == null) {
      writeNumber(balanceKey(userId), STARTING_BALANCE);
      return STARTING_BALANCE;
    }
    return Math.max(0, Math.floor(stored));
  },

  /**
   * GET /api/billing/rate-card — exposes per-mode pricing so the UI can
   * preview a query's cost before the user submits.
   */
  getRateCard(): Record<BillingMode, RateCard> {
    return RATE_CARD;
  },

  /**
   * POST /api/billing/deduct — charges the user for one AI response. Returns
   * the cost, the balance before/after, and whether this drained the wallet.
   * The deduction is clamped to whatever balance remains.
   */
  deduct(userId: string, input: DeductInput): DeductResult {
    if (isUnlimitedMode()) {
      return { cost: 0, balanceBefore: STARTING_BALANCE, balanceAfter: STARTING_BALANCE, exhausted: false };
    }
    const rate = RATE_CARD[input.mode];
    const tokens = Math.max(0, Math.floor(input.outputTokens));
    const cost = Math.max(1, Math.round(rate.baseCost + rate.costPerToken * tokens));
    const before = this.getBalance(userId);
    const after = Math.max(0, before - cost);
    writeNumber(balanceKey(userId), after);

    const tx: Transaction = {
      id: generateTxId(),
      mode: input.mode,
      outputTokens: tokens,
      cost,
      balanceAfter: after,
      createdAt: new Date().toISOString(),
    };
    writeTransactions(userId, [tx, ...readTransactions(userId)]);

    return { cost, balanceBefore: before, balanceAfter: after, exhausted: after === 0 };
  },

  /**
   * GET /api/billing/transactions — most recent N deductions for the user.
   */
  listTransactions(userId: string): Transaction[] {
    return readTransactions(userId);
  },

  /**
   * POST /api/billing/topup — credit the user (used by the demo to simulate
   * a successful purchase from the PaywallModal).
   */
  topUp(userId: string, amount: number): number {
    const next = this.getBalance(userId) + Math.max(0, Math.floor(amount));
    writeNumber(balanceKey(userId), next);
    return next;
  },

  /** Demo helper — wipes the user's balance + history. */
  reset(userId: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(balanceKey(userId));
      window.localStorage.removeItem(txKey(userId));
    } catch {
      /* noop */
    }
  },
};

/**
 * Estimate output tokens from the assistant's response text. Uses the rough
 * GPT/Anthropic heuristic of ~4 chars per token. A real backend would report
 * exact token counts in the SSE done event; until then this is good enough
 * to drive a believable demo.
 */
export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
