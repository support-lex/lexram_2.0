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
 * Must match GST_CHARGED_ON_TOP in the payments service (.env on the server).
 * The modal quotes whatever this says, so if the two disagree the customer is
 * shown one figure and charged another.
 *
 * Cut over on 13 Aug 2026: the backend was switched on first, so that any gap
 * between the two errs towards charging what the invoice states rather than
 * under-collecting. To roll back, unset it in the service .env *before*
 * setting this to false.
 */
export const GST_CHARGED_ON_TOP = true;

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

/** Supplier identity. Appears on every invoice — Rule 46(a). */
export const SUPPLIER = {
  name: 'Ramasubramanian AI Software Pvt. Ltd.',
  brand: 'LexRam',
  email: 'hello@lexram.ai',
  phone: '+91 87544 46066',
  address: 'B 225, 12th Avenue, Ashok Nagar, Chennai, Tamil Nadu — 600083',
  website: 'lexram.ai',
  gstin: '33AAPCR6244K1ZY',
  stateName: 'Tamil Nadu',
  stateCode: SUPPLIER_STATE_CODE,
} as const;

/**
 * SAC (Services Accounting Code) for the supply.
 *
 * 998434 = "On-line software". Alternatives used for SaaS subscriptions are
 * 997331 (licensing services for the right to use software) and 998314 (IT
 * design and development). The right code depends on how the supply is
 * characterised — CONFIRM WITH YOUR CA. A wrong SAC is a filing problem, not
 * a cosmetic one.
 */
export const SAC_CODE = '998434';

export interface TaxBreakdown {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isInterState: boolean;
  placeOfSupplyCode: string;
  placeOfSupplyName: string;
  /** True when derived here rather than read from the payment row. */
  isLegacy: boolean;
}

/** The fields an invoice needs off a payment row. Structural, so both the */
/** printable template and the on-screen modal can pass their own shape. */
export interface TaxSource {
  amount_inr?: number;
  amount?: number;
  taxable_value?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total_amount?: number;
  place_of_supply?: string;
  place_of_supply_code?: string;
}

/**
 * Tax figures for an invoice.
 *
 * Reads the snapshot stored on the payment row when present — that is the
 * authoritative record of what was charged and filed. Falls back to computing
 * only for payments taken before the snapshot existed, and that fallback
 * deliberately reproduces the OLD GST-inclusive maths: those customers really
 * did pay a GST-inclusive amount to a Tamil Nadu supplier, so reprinting must
 * show what they paid, not what current pricing would charge.
 *
 * Shared by the printable invoice and the on-screen modal. Keeping one
 * implementation is the point — two would drift, and a tax document that says
 * different things on screen and in the file is worse than either alone.
 */
export function computeTax(p: TaxSource): TaxBreakdown {
  const amount = p.amount_inr ?? p.amount ?? 0;

  const hasSnapshot =
    p.taxable_value != null && (p.cgst_amount != null || p.igst_amount != null);

  if (hasSnapshot) {
    const code = p.place_of_supply_code ?? SUPPLIER_STATE_CODE;
    const igst = p.igst_amount ?? 0;
    return {
      taxableValue: p.taxable_value ?? 0,
      cgst: p.cgst_amount ?? 0,
      sgst: p.sgst_amount ?? 0,
      igst,
      total: p.total_amount ?? amount,
      isInterState: igst > 0,
      placeOfSupplyCode: code,
      placeOfSupplyName: p.place_of_supply ?? STATE_NAMES[code] ?? SUPPLIER.stateName,
      isLegacy: false,
    };
  }

  const taxableValue = amount / (1 + GST_RATE);
  return {
    taxableValue,
    cgst: taxableValue * (GST_RATE / 2),
    sgst: taxableValue * (GST_RATE / 2),
    igst: 0,
    total: amount,
    isInterState: false,
    placeOfSupplyCode: SUPPLIER_STATE_CODE,
    placeOfSupplyName: SUPPLIER.stateName,
    isLegacy: true,
  };
}

/**
 * Credits granted by a payment.
 *
 * The database column is `credits_granted`; there is no `credits` column. Code
 * that read `payment.credits` therefore always got undefined and displayed 0 —
 * which is why the billing page showed "0" against every row and a
 * "Credits Purchased" total of 0 for an account that had bought 275.
 *
 * `credits` is still accepted because the create-order response uses that name.
 */
export function paymentCredits(p: {
  credits_granted?: number | null;
  credits?: number | null;
}): number {
  return Number(p?.credits_granted ?? p?.credits ?? 0) || 0;
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
