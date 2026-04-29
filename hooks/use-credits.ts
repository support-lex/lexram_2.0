"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { creditsApi } from "@/services/credits";
import type { BillingMode, DeductResult } from "@/lib/billing";

const DEFAULT_CEILING = 50; // new users receive 50 free credits

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
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [ceiling, setCeiling] = useState(DEFAULT_CEILING);
  const [ready, setReady] = useState(false);
  const ceilingRef = useRef(DEFAULT_CEILING);
  // Capture pre-query balance in a ref so deductForResponse can read it
  const balanceRef = useRef(0);

  const adoptBalance = useCallback((value: number) => {
    balanceRef.current = value;
    setBalance(value);
    if (value > ceilingRef.current) {
      ceilingRef.current = value;
      setCeiling(value);
    }
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

  useEffect(() => {
    let mounted = true;
    supabase()
      .auth.getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (uid) fetchBalance();
        setReady(true);
      });

    const { data: sub } = supabase().auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        ceilingRef.current = DEFAULT_CEILING;
        setCeiling(DEFAULT_CEILING);
        fetchBalance();
      } else {
        adoptBalance(0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [adoptBalance, fetchBalance]);

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
