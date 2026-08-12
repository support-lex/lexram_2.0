import { supabase } from '@/lib/supabase/client';

export interface CreditBalance {
  user_id: string;
  balance: number;
}

export interface CreditTransaction {
  id: string;
  delta: number;
  reason: string;
  balance_after: number;
  metadata: { session_id?: string; query_number?: number } | null;
  created_at: string;
}

export interface CreateOrderResponse {
  order_id: string;
  payment_session_id: string;
  /** Pre-GST amount the user selected. */
  amount: number;
  /** Gross charged to the gateway = amount + GST. Absent on older backends. */
  total_amount?: number;
  gst_amount?: number;
  currency: string;
  credits: number;
}

/**
 * Billing details sent with the order. `customer_state_code` is the two-digit
 * GST state code and is what decides CGST+SGST vs IGST — without it the backend
 * falls back to the supplier's own state and every sale is billed as
 * intra-state, which is wrong for customers outside Tamil Nadu.
 */
export interface OrderBillingDetails {
  customer_name?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state_code?: string;
  customer_pincode?: string;
  customer_gstin?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`);
  return data as T;
}

export const creditsApi = {
  getBalance(): Promise<CreditBalance> {
    return apiFetch<CreditBalance>('/api/credits/balance');
  },

  getTransactions(): Promise<{ user_id: string; transactions: CreditTransaction[] }> {
    return apiFetch('/api/credits/transactions');
  },

  /**
   * `amount_inr` is the PRE-GST amount. The backend charges amount + GST and
   * grants credits on the pre-GST value.
   */
  createOrder(
    amount_inr: number,
    user_email: string,
    user_phone: string,
    billing: OrderBillingDetails = {},
  ): Promise<CreateOrderResponse> {
    return apiFetch<CreateOrderResponse>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount_inr, user_email, user_phone, ...billing }),
    });
  },
};
