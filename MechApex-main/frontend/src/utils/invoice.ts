import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { inr, fmtDate } from '@/src/utils/format';

function esc(s: string | undefined | null): string {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function invoiceHtml(job: any, garage: any): string {
  const items = (job.items || []).map(
    (it: any) => `
      <tr>
        <td>${esc(it.name)}</td>
        <td class="c">${it.qty || 1}</td>
        <td class="r">${inr(it.price)}</td>
        <td class="r">${inr((it.price || 0) * (it.qty || 1))}</td>
      </tr>`,
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #BE123C; padding-bottom: 16px; }
  .garage h1 { font-size: 22px; margin: 0 0 6px; color: #BE123C; }
  .garage p { margin: 0; font-size: 12px; color: #4B5563; line-height: 1.5; }
  .inv-title { text-align: right; font-size: 12px; color: #6B7280; }
  .inv-title h2 { font-size: 18px; color: #111827; margin: 0 0 4px; }
  .section { margin-top: 24px; }
  .section h3 { font-size: 13px; color: #6B7280; letter-spacing: 1.2px; margin: 0 0 6px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6B7280; letter-spacing: 1px; padding: 10px 8px; border-bottom: 1px solid #E5E7EB; }
  td { padding: 10px 8px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
  td.r, th.r { text-align: right; }
  td.c, th.c { text-align: center; }
  .total { display: flex; justify-content: flex-end; margin-top: 16px; }
  .total-box { background: #FFE4E6; padding: 14px 18px; border-radius: 10px; font-weight: 700; color: #881337; font-size: 15px; }
  .thanks { text-align: center; margin-top: 40px; padding: 16px; border-top: 1px solid #E5E7EB; color: #4B5563; font-size: 13px; }
  .row { display: flex; gap: 24px; }
  .row > div { flex: 1; }
  .k { color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px; }
  .v { color: #111827; font-size: 13px; font-weight: 600; }
</style></head><body>
  <div class="header">
    <div class="garage">
      <h1>${esc(garage?.garage_name || 'MechApex')}</h1>
      <p>${esc(garage?.address || '')}</p>
      <p>Phone: ${esc(garage?.telephone || '')}${garage?.gstin ? ' &nbsp;•&nbsp; GSTIN: ' + esc(garage.gstin) : ''}</p>
    </div>
    <div class="inv-title">
      <h2>INVOICE</h2>
      <div>${esc(fmtDate(job.completed_at || job.updated_at || job.created_at))}</div>
      <div style="margin-top:2px;">Ref: ${esc((job.id || '').slice(0, 8).toUpperCase())}</div>
    </div>
  </div>

  <div class="section">
    <div class="row">
      <div>
        <div class="k">Customer</div>
        <div class="v">${esc(job.customer_name)}</div>
        <div style="color:#6B7280; font-size:12px; margin-top:2px;">${esc(job.customer_phone)}</div>
      </div>
      <div>
        <div class="k">Vehicle</div>
        <div class="v">${esc(job.vehicle_brand)} ${esc(job.vehicle_model)}</div>
        <div style="color:#6B7280; font-size:12px; margin-top:2px;">${esc(job.vehicle_reg_no)}${job.vehicle_year ? ' • ' + job.vehicle_year : ''}${job.fuel ? ' • ' + esc(job.fuel) : ''}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>ITEMS</h3>
    <table>
      <thead><tr><th>Description</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${items || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;padding:24px;">No items</td></tr>'}</tbody>
    </table>
  </div>

  <div class="total">
    <div class="total-box">TOTAL &nbsp; ${inr(job.total || 0)}</div>
  </div>

  <div class="thanks">
    Thank you for choosing ${esc(garage?.garage_name || 'us')}!<br/>
    We look forward to serving you again.
  </div>
</body></html>`;
}

export async function generateAndShareInvoice(job: any, garage: any) {
  const html = invoiceHtml(job, garage);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Invoice' });
  }
  return uri;
}
