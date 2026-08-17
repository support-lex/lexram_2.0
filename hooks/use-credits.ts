"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-provider";
import { creditsApi } from "@/services/credits";
import type { BillingMode, DeductResult } from "@/lib/billing";

const DEFAULT_CEILING = 50; // new users receive 50 free credits
const LS_KEY = "lexram_credits_v1";

function readCache(): { balance: number; ceiling: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.balance === "number" && typeof parsed.ceiling === "number") return parsed;
  } catch {}
  return null;
}

function writeCache(balance: number, ceiling: number) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ balance, ceiling })); } catch {}
}

export interface UseCreditsResult {
  userId: string | null;
  balance: number;
  ceiling: number;
  ready: boolean;
  deductForResponse: (mode: BillingMode, responseText: string) => Promise<DeductResult | null>;
  topUp: (amount: number) => void;
  refresh: () => void;
  reset: () => void;
}

export function useCredits(): UseCreditsResult {
  const cached = typeof window !== "undefined" ? readCache() : null;
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(cached?.balance ?? 0);
  const [ceiling, setCeiling] = useState(cached?.ceiling ?? DEFAULT_CEILING);
  const [ready, setReady] = useState(false);
  const ceilingRef = useRef(cached?.ceiling ?? DEFAULT_CEILING);
  // Capture pre-query balance in a ref so deductForResponse can read it
  const balanceRef = useRef(cached?.balance ?? 0);

  const adoptBalance = useCallback((value: number) => {
    balanceRef.current = value;
    setBalance(value);
    if (value > ceilingRef.current) {
      ceilingRef.current = value;
      setCeiling(value);
    }
    writeCache(value, ceilingRef.current);
  }, []);

  const fetchBalance = useCallback(async (): Promise<number> => {
    try {
      const { balance: fresh } = await creditsApi.getBalance();
      adoptBalance(fresh);
      return fresh;
    } catch {
      return balanceRef.current;
    }
  }, [adoptBalance]);

  // Auth comes from the single source of truth. We refetch the balance when
  // auth becomes ready and whenever the user id changes.
  //
  // NEVER reset the ceiling on a refetch: the auth snapshot updates on
  // INITIAL_SESSION (every mount) and TOKEN_REFRESHED (hourly); resetting
  // ceiling to DEFAULT_CEILING and then fetching a balance ≥ default made
  // adoptBalance grow the ceiling to match — leaving the meter at "X / X"
  // (looks full) on every refresh. The ceiling is the historical max and only
  // ever grows (inside adoptBalance), never shrinks.
  const { user, ready: authReady } = useAuth();
  const uid = user?.id ?? null;
  useEffect(() => {
    if (!authReady) return;
    setUserId(uid);
    if (uid) {
      fetchBalance();
    } else {
      // Signed out / guest. Zero the live balance but keep the cached ceiling.
      adoptBalance(0);
    }
    setReady(true);
  }, [authReady, uid, adoptBalance, fetchBalance]);

  // Called after each AI response — refreshes balance from the server
  // (the backend deducts credits automatically on each query).
  const deductForResponse = useCallback(
    async (_mode: BillingMode, _responseText: string): Promise<DeductResult | null> => {
      if (!userId) return null;
      const balanceBefore = balanceRef.current;
      const balanceAfter = await fetchBalance();
      const cost = Math.max(0, balanceBefore - balanceAfter);
      return { cost, balanceBefore, balanceAfter, exhausted: balanceAfter === 0 };
    },
    [userId, fetchBalance]
  );

  const refresh = useCallback(() => { fetchBalance(); }, [fetchBalance]);

  // topUp is a hook for external callers; the PaywallModal drives the actual
  // payment flow and calls refresh() after Cashfree confirms payment.
  const topUp = useCallback((_amount: number) => { fetchBalance(); }, [fetchBalance]);

  const reset = useCallback(() => { fetchBalance(); }, [fetchBalance]);

  return { userId, balance, ceiling, ready, deductForResponse, topUp, refresh, reset };
}
