/**
 * Single source of truth for top-up pricing and GST behaviour.
 *
 * Kept out of the components so the checkout modal, the invoice template and
 * anything else that quotes a price cannot drift apart.
 */

/** Minimum top-up, exclusive of GST. Below this the gateway is never called. */
export const MIN_TOPUP_INR = 500;

export const GST_RATE = 0.18;

/** ₹2 = 1 credit. */
export const CREDITS_PER_RUPEE = 0.5;

/**
 * Whether GST is added ON TOP of the amount the user enters.
 *
 * MUST remain false until lexram-payments charges `amount × 1.18` and grants
 * credits on the pre-GST amount. The modal quotes whatever this says, so
 * flipping it early would show the user a total the gateway does not actually
 * charge — and would grant the wrong number of credits, since the backend
 * currently derives credits from the full amount it receives.
 *
 * When the backend lands: flip to true here, and nothing else in the UI needs
 * to change.
 */
export const GST_CHARGED_ON_TOP = false;

export interface AmountBreakdown {
  /** What the user entered — the taxable value when GST is added on top. */
  subtotal: number;
  gst: number;
  /** What the gateway will actually charge. */
  total: number;
  credits: number;
}

/**
 * Splits an entered amount into what is taxable, what GST applies, and what
 * gets charged. Credits are always granted on the pre-GST value — a customer
 * paying for ₹500 of credits gets 250 regardless of the tax on top.
 */
export function breakdown(amount: number): AmountBreakdown {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { subtotal: 0, gst: 0, total: 0, credits: 0 };
  }
  if (GST_CHARGED_ON_TOP) {
    const gst = Math.round(amount * GST_RATE * 100) / 100;
    return {
      subtotal: amount,
      gst,
      total: Math.round((amount + gst) * 100) / 100,
      credits: Math.floor(amount * CREDITS_PER_RUPEE),
    };
  }
  // Legacy: the entered amount is GST-inclusive, so back the tax out of it.
  const subtotal = Math.round((amount / (1 + GST_RATE)) * 100) / 100;
  return {
    subtotal,
    gst: Math.round((amount - subtotal) * 100) / 100,
    total: amount,
    credits: Math.floor(amount * CREDITS_PER_RUPEE),
  };
}

export function fmtINR(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
}

/** GST state codes → names. Used for place of supply on the invoice. */
export const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
  '38': 'Ladakh', '97': 'Other Territory',
};

/** Sorted [code, name] pairs for a dropdown. */
export const STATE_OPTIONS: Array<[string, string]> = Object.entries(STATE_NAMES)
  .sort((a, b) => a[1].localeCompare(b[1]));

/** The supplier's own state — sales here are intra-state (CGST + SGST). */
export const SUPPLIER_STATE_CODE = '33';

/**
 * Structural GSTIN check: 2-digit state code, 10-char PAN, entity digit, 'Z',
 * checksum. Deliberately not a checksum validation — this only catches typos
 * and obviously wrong input. An invalid GSTIN on an invoice is worse than none,
 * because the customer will try to claim input credit against it and fail.
 */
export function isValidGSTINFormat(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase());
}

/** State code embedded in a GSTIN's first two digits, if it looks valid. */
export function stateCodeFromGSTIN(gstin: string): string | null {
  const g = gstin.trim().toUpperCase();
  if (!isValidGSTINFormat(g)) return null;
  const code = g.slice(0, 2);
  return STATE_NAMES[code] ? code : null;
}

/** Billing details captured at first payment and reused thereafter. */
export interface BillingDetails {
  address: string;
  city: string;
  stateCode: string;
  pincode: string;
  gstin: string;
}

export const EMPTY_BILLING: BillingDetails = {
  address: '', city: '', stateCode: '', pincode: '', gstin: '',
};

/** Address, state and pincode are mandatory; GSTIN is optional but validated. */
export function validateBilling(b: BillingDetails): string | null {
  if (!b.address.trim()) return 'Billing address is required';
  if (!b.city.trim()) return 'City is required';
  if (!b.stateCode) return 'State is required';
  if (!/^[1-9][0-9]{5}$/.test(b.pincode.trim())) return 'Enter a valid 6-digit PIN code';
  if (b.gstin.trim() && !isValidGSTINFormat(b.gstin)) return 'GSTIN format looks incorrect';
  const fromGstin = stateCodeFromGSTIN(b.gstin);
  if (fromGstin && fromGstin !== b.stateCode) {
    return `GSTIN belongs to ${STATE_NAMES[fromGstin]} — it must match the selected state`;
  }
  return null;
}
