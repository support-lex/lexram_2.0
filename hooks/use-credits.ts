"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  billingApi,
  estimateTokens,
  STARTING_BALANCE,
  type BillingMode,
  type DeductResult,
} from "@/lib/billing";

export interface UseCreditsResult {
  /** Supabase user id, or null if signed out. */
  userId: string | null;
  /** Current credit balance (0 when signed out). */
  balance: number;
  /** Maximum balance ever held — used to render the meter's progress bar. */
  ceiling: number;
  /** True once the initial balance has been read from storage. */
  ready: boolean;
  /**
   * Charge the user for one AI response. Returns null if signed out.
   * The cost is base-rate + token-rate * outputTokens for the given mode.
   */
  deductForResponse: (mode: BillingMode, responseText: string) => DeductResult | null;
  /** Add credits to the wallet (demo top-up flow). */
  topUp: (amount: number) => void;
  /** Re-read balance from storage. */
  refresh: () => void;
  /** Demo helper: wipe balance + transactions. */
  reset: () => void;
}

export function useCredits(): UseCreditsResult {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [ceiling, setCeiling] = useState<number>(STARTING_BALANCE);
  const [ready, setReady] = useState<boolean>(false);
  // Latest balance value, captured in a ref so async effects can read the
  // current ceiling without depending on the state closure.
  const ceilingRef = useRef<number>(STARTING_BALANCE);

  const adoptBalance = useCallback((value: number) => {
    setBalance(value);
    if (value > ceilingRef.current) {
      ceilingRef.current = value;
      setCeiling(value);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (uid) adoptBalance(billingApi.getBalance(uid));
        setReady(true);
      });

    const { data: sub } = supabase().auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        ceilingRef.current = STARTING_BALANCE;
        setCeiling(STARTING_BALANCE);
        adoptBalance(billingApi.getBalance(uid));
      } else {
        adoptBalance(0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [adoptBalance]);

  const deductForResponse = useCallback(
    (mode: BillingMode, responseText: string): DeductResult | null => {
      if (!userId) return null;
      const tokens = estimateTokens(responseText);
      const result = billingApi.deduct(userId, { mode, outputTokens: tokens });
      adoptBalance(result.balanceAfter);
      return result;
    },
    [userId, adoptBalance]
  );

  const topUp = useCallback(
    (amount: number) => {
      if (!userId) return;
      const next = billingApi.topUp(userId, amount);
      adoptBalance(next);
    },
    [userId, adoptBalance]
  );

  const refresh = useCallback(() => {
    if (!userId) return;
    adoptBalance(billingApi.getBalance(userId));
  }, [userId, adoptBalance]);

  const reset = useCallback(() => {
    if (!userId) return;
    billingApi.reset(userId);
    ceilingRef.current = STARTING_BALANCE;
    setCeiling(STARTING_BALANCE);
    adoptBalance(billingApi.getBalance(userId));
  }, [userId, adoptBalance]);

  return { userId, balance, ceiling, ready, deductForResponse, topUp, refresh, reset };
}
