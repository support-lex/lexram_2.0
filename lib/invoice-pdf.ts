import type { Payment } from '@/components/InvoiceView';

const COMPANY = {
  name: 'Ramasubramanian AI Software Pvt. Ltd.',
  brand: 'LexRam',
  email: 'hello@lexram.ai',
  phone: '+91 87544 46066',
  address: 'B 225, 12th Avenue, Ashok Nagar, Chennai, Tamil Nadu — 600083',
  website: 'lexram.ai',
  gstin: '33AAPCR6244K1ZY',
  stateName: 'Tamil Nadu',
  stateCode: '33',
};

/**
 * SAC (Services Accounting Code) for the supply.
 *
 * 998434 = "On-line software" under Group 99843 (on-line content).
 * Alternatives sometimes used for SaaS subscriptions are 997331 (licensing
 * services for the right to use software) and 998314 (IT design and
 * development). The correct code depends on how the supply is characterised,
 * so CONFIRM THIS WITH YOUR CA before relying on it — an invoice carrying the
 * wrong SAC is a filing problem, not a cosmetic one.
 */
const SAC_CODE = '998434';

const GST_RATE = 0.18;

/** GST state codes → names, for place-of-supply display. */
const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
  '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory',
};

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(d?: string) {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Escape user-controlled values before interpolating into the HTML document. */
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function invNum(p: Payment) {
  // Prefer the sequential number assigned at payment time. Rule 46(b) requires a
  // consecutive serial unique to the financial year; a slice of the gateway
  // order id (the legacy path below) satisfies neither, and is kept only so
  // pre-cutover payments still render something stable.
  if (p.invoice_number) return p.invoice_number;
  if (p.order_id) {
    const parts = p.order_id.split('_');
    return `INV-${(parts[parts.length - 1] ?? p.id.slice(0, 8)).toUpperCase().slice(0, 8)}`;
  }
  return `INV-${p.id.slice(0, 8).toUpperCase()}`;
}

interface TaxBreakdown {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isInterState: boolean;
  placeOfSupplyCode: string;
  placeOfSupplyName: string;
  /** True when the figures were derived here rather than read from the payment row. */
  isLegacy: boolean;
}

/**
 * Tax figures for the invoice.
 *
 * Reads the snapshot stored on the payment row when present — that is the
 * authoritative record of what was actually charged and filed. Only falls back
 * to computing when those columns are absent, i.e. for payments taken before
 * the snapshot existed.
 *
 * The fallback deliberately reproduces the OLD GST-inclusive maths (tax backed
 * out of the amount, always CGST+SGST). Those customers really did pay a
 * GST-inclusive amount to a Tamil Nadu supplier, so reprinting their invoice
 * must show what they paid — not what the current pricing model would charge.
 */
function computeTax(payment: Payment): TaxBreakdown {
  const amount = payment.amount_inr ?? payment.amount ?? 0;

  const hasSnapshot =
    payment.taxable_value != null &&
    (payment.cgst_amount != null || payment.igst_amount != null);

  if (hasSnapshot) {
    const code = payment.place_of_supply_code ?? COMPANY.stateCode;
    const igst = payment.igst_amount ?? 0;
    return {
      taxableValue: payment.taxable_value ?? 0,
      cgst: payment.cgst_amount ?? 0,
      sgst: payment.sgst_amount ?? 0,
      igst,
      total: payment.total_amount ?? amount,
      isInterState: igst > 0,
      placeOfSupplyCode: code,
      placeOfSupplyName:
        payment.place_of_supply ?? STATE_NAMES[code] ?? COMPANY.stateName,
      isLegacy: false,
    };
  }

  // ── Legacy: pre-snapshot payments were charged GST-inclusive, intra-state ──
  const taxableValue = amount / (1 + GST_RATE);
  return {
    taxableValue,
    cgst: taxableValue * (GST_RATE / 2),
    sgst: taxableValue * (GST_RATE / 2),
    igst: 0,
    total: amount,
    isInterState: false,
    placeOfSupplyCode: COMPANY.stateCode,
    placeOfSupplyName: COMPANY.stateName,
    isLegacy: true,
  };
}

function buildHTML(payment: Payment, userEmail: string, userName: string): string {
  const num     = invNum(payment);
  const credits = payment.credits ?? 0;
  const t       = computeTax(payment);
  const date    = fmtDate(payment.paid_at ?? payment.created_at);
  const rate    = credits > 0 ? t.taxableValue / credits : 0;

  const statusTxt = (() => {
    const s = (payment.status ?? '').toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') return 'Paid';
    if (s === 'PENDING') return 'Pending';
    return payment.status ?? 'Paid';
  })();

  const taxRows = t.isInterState
    ? `<div class="totals-row"><span>IGST @18%</span><span>${fmtINR(t.igst)}</span></div>`
    : `<div class="totals-row"><span>CGST @9%</span><span>${fmtINR(t.cgst)}</span></div>
       <div class="totals-row"><span>SGST @9%</span><span>${fmtINR(t.sgst)}</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(num)} — LexRam Tax Invoice</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #f9fafb; color: #111827;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { max-width: 760px; margin: 40px auto; background: #fff; border-radius: 16px;
          box-shadow: 0 4px 40px rgba(0,0,0,0.10); overflow: hidden; }
  .accent-bar { height: 6px; background: linear-gradient(90deg,#fbbf24 0%,#f59e0b 50%,#fbbf24 100%); }
  .body { padding: 44px; }

  .doc-type { text-align:center; font-size:11px; font-weight:700; letter-spacing:0.14em;
              text-transform:uppercase; color:#6b7280; margin-bottom:28px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 24px; }
  .logo-img { height: 34px; width: auto; display: block; margin-bottom: 10px; }
  .company-name { font-size: 13px; font-weight: 700; color:#111827; margin-bottom: 4px; }
  .company-info { font-size: 11px; color: #6b7280; line-height: 1.7; }
  .company-gstin { font-size: 11px; color:#111827; font-weight:600; margin-top:4px;
                   font-family:"Courier New",monospace; }

  .invoice-meta { text-align: right; flex-shrink:0; }
  .invoice-title { font-family: Georgia,"Times New Roman",serif; font-size: 28px; font-weight: 300; color:#111827; margin-bottom: 4px; }
  .invoice-num { font-family:"Courier New",monospace; font-size: 13px; font-weight: 600; color:#374151; }
  .meta-row { display:flex; justify-content:flex-end; gap:16px; margin-top:6px; font-size:12px; }
  .meta-label { color:#9ca3af; }
  .meta-value { color:#374151; font-weight:500; }
  .badge { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:999px;
           font-size:11px; font-weight:600; background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; }

  .divider { height:1px; background:#f3f4f6; margin:24px 0; }

  .parties { display:flex; gap:32px; margin-bottom:24px; }
  .party { flex:1; }
  .section-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;
                   color:#9ca3af; margin-bottom:8px; }
  .billed-name { font-size:14px; font-weight:600; color:#111827; }
  .billed-line { font-size:12px; color:#6b7280; margin-top:2px; }
  .billed-gstin { font-size:12px; color:#111827; font-weight:600; margin-top:4px;
                  font-family:"Courier New",monospace; }

  .items-table { width:100%; border-collapse:collapse; border-radius:12px; overflow:hidden;
                 border:1px solid #f3f4f6; margin:20px 0; }
  .items-table thead tr { background:#f9fafb; }
  .items-table th { padding:11px 14px; font-size:10px; font-weight:700; text-transform:uppercase;
                    letter-spacing:0.08em; color:#9ca3af; text-align:left; }
  .items-table th.right { text-align:right; } .items-table th.center { text-align:center; }
  .items-table td { padding:16px 14px; font-size:13px; color:#374151; border-top:1px solid #f3f4f6; vertical-align:middle; }
  .items-table td.right { text-align:right; font-weight:700; color:#111827; }
  .items-table td.center { text-align:center; font-weight:500; }
  .item-name { font-weight:600; color:#111827; margin-bottom:3px; }
  .item-sub { font-size:11px; color:#9ca3af; }

  .totals { display:flex; justify-content:flex-end; margin-bottom:24px; }
  .totals-box { width:250px; }
  .totals-row { display:flex; justify-content:space-between; font-size:12px; color:#6b7280; padding:4px 0; }
  .totals-divider { height:1px; background:#e5e7eb; margin:8px 0; }
  .totals-total { display:flex; justify-content:space-between; font-size:15px; font-weight:700; color:#111827; padding:4px 0; }

  .ref-box { background:#f9fafb; border:1px solid #f3f4f6; border-radius:12px; padding:14px 18px; margin-bottom:20px; }
  .ref-row { display:flex; gap:20px; font-size:12px; margin-top:7px; }
  .ref-label { color:#9ca3af; min-width:110px; }
  .ref-value { color:#4b5563; font-family:"Courier New",monospace; word-break:break-all; }

  .declaration { font-size:10px; color:#9ca3af; line-height:1.7; margin-bottom:18px; }
  .sign-row { display:flex; justify-content:flex-end; margin-bottom:20px; }
  .sign-box { text-align:center; font-size:11px; color:#6b7280; }
  .sign-for { font-weight:600; color:#374151; margin-bottom:34px; }

  .footer { display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#9ca3af;
            border-top:1px solid #f3f4f6; padding-top:16px; }

  @media print {
    body { background:white; }
    .page { box-shadow:none; margin:0; border-radius:0; max-width:100%; }
    @page { margin:10mm; size:A4; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="body">

    <div class="doc-type">Tax Invoice</div>

    <div class="header">
      <div>
        <img class="logo-img" src="https://lexram.ai/lexram-logo.png" alt="${esc(COMPANY.brand)}" />
        <div class="company-name">${esc(COMPANY.name)}</div>
        <div class="company-info">
          ${esc(COMPANY.address)}<br>
          ${esc(COMPANY.email)} · ${esc(COMPANY.phone)}
        </div>
        <div class="company-gstin">GSTIN: ${esc(COMPANY.gstin)}</div>
        <div class="company-info">State: ${esc(COMPANY.stateName)} (${esc(COMPANY.stateCode)})</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-num">${esc(num)}</div>
        <div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">${esc(date)}</span></div>
        <div class="meta-row"><span class="meta-label">Status</span><span class="badge">✓ ${esc(statusTxt)}</span></div>
        <div class="meta-row"><span class="meta-label">Reverse Charge</span><span class="meta-value">No</span></div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="parties">
      <div class="party">
        <div class="section-label">Billed To</div>
        ${userName ? `<div class="billed-name">${esc(userName)}</div>` : ''}
        <div class="billed-line">${esc(userEmail)}</div>
        ${payment.user_phone ? `<div class="billed-line">+91 ${esc(payment.user_phone)}</div>` : ''}
        ${payment.customer_gstin ? `<div class="billed-gstin">GSTIN: ${esc(payment.customer_gstin)}</div>` : ''}
      </div>
      <div class="party">
        <div class="section-label">Place of Supply</div>
        <div class="billed-name">${esc(t.placeOfSupplyName)}</div>
        <div class="billed-line">State Code: ${esc(t.placeOfSupplyCode)}</div>
        <div class="billed-line">${t.isInterState ? 'Inter-State supply (IGST)' : 'Intra-State supply (CGST + SGST)'}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:42%">Description</th>
          <th class="center" style="width:12%">SAC</th>
          <th class="center" style="width:12%">Qty</th>
          <th class="center" style="width:14%">Rate</th>
          <th class="right" style="width:20%">Taxable Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-name">LexRam AI Credits</div>
            <div class="item-sub">Valid for all research &amp; drafting · Never expire</div>
          </td>
          <td class="center">${esc(SAC_CODE)}</td>
          <td class="center">${credits.toLocaleString('en-IN')}</td>
          <td class="center" style="color:#9ca3af">${rate > 0 ? fmtINR(rate) : '—'}</td>
          <td class="right">${fmtINR(t.taxableValue)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Taxable Value</span><span>${fmtINR(t.taxableValue)}</span></div>
        ${taxRows}
        <div class="totals-divider"></div>
        <div class="totals-total"><span>Total Paid</span><span>${fmtINR(t.total)}</span></div>
      </div>
    </div>

    ${payment.order_id || payment.cashfree_payment_id ? `
    <div class="ref-box">
      <div class="section-label">Payment Reference</div>
      ${payment.order_id ? `<div class="ref-row"><span class="ref-label">Order ID</span><span class="ref-value">${esc(payment.order_id)}</span></div>` : ''}
      ${payment.cashfree_payment_id ? `<div class="ref-row"><span class="ref-label">Payment ID</span><span class="ref-value">${esc(payment.cashfree_payment_id)}</span></div>` : ''}
      <div class="ref-row"><span class="ref-label">Gateway</span><span class="ref-value">Cashfree Payments</span></div>
    </div>` : ''}

    <div class="declaration">
      Whether tax is payable under reverse charge: <strong>No</strong>.<br>
      We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.
    </div>

    <div class="sign-row">
      <div class="sign-box">
        <div class="sign-for">For ${esc(COMPANY.name)}</div>
        <div>Authorised Signatory</div>
      </div>
    </div>

    <div class="footer">
      <span>⚖ ${esc(COMPANY.brand)} · ${esc(COMPANY.website)}</span>
      <span>This is a computer-generated invoice and does not require a physical signature.</span>
    </div>
  </div>
</div>
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 400);
  });
</script>
</body>
</html>`;
}

/**
 * Opens a self-contained invoice HTML document in a new tab and triggers
 * the browser's print dialog (user saves as PDF from there).
 */
export function openInvoicePDF(
  payment: Payment,
  userEmail: string,
  userName: string,
) {
  const html = buildHTML(payment, userEmail, userName);
  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked — fallback: download as .html
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${invNum(payment)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
