import type { Payment } from '@/components/InvoiceView';

const COMPANY = {
  name: 'Ramasubramanian AI Software Pvt. Ltd.',
  brand: 'LexRam',
  email: 'hello@lexram.ai',
  phone: '+91 87544 46066',
  address: 'B 225, 12th Avenue, Ashok Nagar, Chennai, Tamil Nadu — 600083',
  website: 'lexram.ai',
};

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function invNum(p: Payment) {
  if (p.order_id) {
    const parts = p.order_id.split('_');
    return `INV-${(parts[parts.length - 1] ?? p.id.slice(0, 8)).toUpperCase().slice(0, 8)}`;
  }
  return `INV-${p.id.slice(0, 8).toUpperCase()}`;
}

function buildHTML(payment: Payment, userEmail: string, userName: string): string {
  const num       = invNum(payment);
  const amount    = payment.amount_inr ?? payment.amount ?? 0;
  const credits   = payment.credits ?? 0;
  const date      = fmtDate(payment.paid_at ?? payment.created_at);
  const statusTxt = (() => {
    const s = (payment.status ?? '').toUpperCase();
    if (s === 'PAID' || s === 'SUCCESS' || s === 'COMPLETED') return 'Paid';
    if (s === 'PENDING') return 'Pending';
    return payment.status ?? 'Paid';
  })();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${num} — LexRam Invoice</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #f9fafb;
    color: #111827;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 740px;
    margin: 40px auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 40px rgba(0,0,0,0.10);
    overflow: hidden;
  }

  .accent-bar {
    height: 6px;
    background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%);
  }

  .body { padding: 48px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .logo-box {
    width: 36px; height: 36px; border-radius: 10px;
    background: #111827;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .logo-name { font-family: Georgia, "Times New Roman", serif; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #111827; }
  .company-info { font-size: 11px; color: #9ca3af; line-height: 1.7; }

  .invoice-meta { text-align: right; }
  .invoice-title { font-family: Georgia, "Times New Roman", serif; font-size: 32px; font-weight: 300; color: #111827; margin-bottom: 4px; }
  .invoice-num { font-family: "Courier New", monospace; font-size: 13px; font-weight: 600; color: #374151; }
  .meta-table { margin-top: 12px; font-size: 12px; }
  .meta-row { display: flex; justify-content: flex-end; gap: 16px; margin-top: 6px; }
  .meta-label { color: #9ca3af; }
  .meta-value { color: #374151; font-weight: 500; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
    background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;
  }

  /* Divider */
  .divider { height: 1px; background: #f3f4f6; margin: 32px 0; }

  /* Billed To */
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 8px; }
  .billed-name { font-size: 14px; font-weight: 600; color: #111827; }
  .billed-email { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .billed-phone { font-size: 13px; color: #9ca3af; margin-top: 2px; }

  /* Table */
  .items-table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #f3f4f6; margin: 24px 0; }
  .items-table thead tr { background: #f9fafb; }
  .items-table th { padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; text-align: left; }
  .items-table th.right { text-align: right; }
  .items-table th.center { text-align: center; }
  .items-table td { padding: 18px 16px; font-size: 13px; color: #374151; border-top: 1px solid #f3f4f6; vertical-align: middle; }
  .items-table td.right { text-align: right; font-weight: 700; color: #111827; }
  .items-table td.center { text-align: center; font-weight: 500; }
  .item-name { font-weight: 600; color: #111827; margin-bottom: 3px; }
  .item-sub { font-size: 11px; color: #9ca3af; }

  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 220px; }
  .totals-row { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; padding: 4px 0; }
  .totals-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
  .totals-total { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #111827; padding: 4px 0; }

  /* Reference */
  .ref-box { background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; }
  .ref-row { display: flex; gap: 24px; font-size: 12px; margin-top: 8px; }
  .ref-label { color: #9ca3af; min-width: 100px; }
  .ref-value { color: #4b5563; font-family: "Courier New", monospace; word-break: break-all; }

  /* Footer */
  .footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #9ca3af; }

  @media print {
    body { background: white; }
    .page { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
    @page { margin: 12mm; size: A4; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="body">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo-row">
          <div class="logo-box">⚖</div>
          <div class="logo-name">${COMPANY.brand}</div>
        </div>
        <div class="company-info">
          ${COMPANY.name}<br>
          ${COMPANY.address}<br>
          ${COMPANY.email} · ${COMPANY.phone}
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Invoice</div>
        <div class="invoice-num">${num}</div>
        <div class="meta-table">
          <div class="meta-row">
            <span class="meta-label">Date</span>
            <span class="meta-value">${date}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Status</span>
            <span class="badge">✓ ${statusTxt}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Billed To -->
    <div style="margin-bottom:32px">
      <div class="section-label">Billed To</div>
      ${userName ? `<div class="billed-name">${userName}</div>` : ''}
      <div class="billed-email">${userEmail}</div>
      ${payment.user_phone ? `<div class="billed-phone">+91 ${payment.user_phone}</div>` : ''}
    </div>

    <!-- Line items -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:50%">Description</th>
          <th class="center" style="width:15%">Qty</th>
          <th class="center" style="width:15%">Rate</th>
          <th class="right" style="width:20%">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-name">LexRam AI Credits</div>
            <div class="item-sub">Valid for all research &amp; drafting · Never expire</div>
          </td>
          <td class="center">${credits.toLocaleString('en-IN')}</td>
          <td class="center" style="color:#9ca3af">₹2 / cr</td>
          <td class="right">${fmtINR(amount)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Subtotal</span><span>${fmtINR(amount)}</span></div>
        <div class="totals-row"><span>GST (0%)</span><span>₹0</span></div>
        <div class="totals-divider"></div>
        <div class="totals-total"><span>Total Paid</span><span>${fmtINR(amount)}</span></div>
      </div>
    </div>

    <!-- Payment reference -->
    ${payment.order_id || payment.cashfree_payment_id ? `
    <div class="ref-box">
      <div class="section-label">Payment Reference</div>
      ${payment.order_id ? `<div class="ref-row"><span class="ref-label">Order ID</span><span class="ref-value">${payment.order_id}</span></div>` : ''}
      ${payment.cashfree_payment_id ? `<div class="ref-row"><span class="ref-label">Payment ID</span><span class="ref-value">${payment.cashfree_payment_id}</span></div>` : ''}
      <div class="ref-row"><span class="ref-label">Gateway</span><span class="ref-value">Cashfree Payments</span></div>
    </div>
    ` : ''}

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <span>⚖ ${COMPANY.brand} · ${COMPANY.website}</span>
      <span>Thank you for choosing LexRam!</span>
    </div>
  </div>
</div>
<script>
  // Auto-trigger print after fonts & layout settle
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
 * No canvas, no refs, no dynamic-import issues.
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
