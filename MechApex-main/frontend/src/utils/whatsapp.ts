import { Linking, Platform } from 'react-native';
import { inr, fmtDate } from '@/src/utils/format';

/**
 * Compose a WhatsApp deep-link with pre-filled message for the invoice.
 */
export function buildWaLink(phone: string, message: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  // wa.me expects international format without leading + or zero
  const p = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

export function invoiceMessage(job: any, garage: any): string {
  const lines: string[] = [];
  lines.push(`Hi ${job.customer_name},`);
  lines.push('');
  lines.push(`Thank you for choosing *${garage?.garage_name || 'our garage'}*.`);
  lines.push(`Vehicle: ${job.vehicle_brand} ${job.vehicle_model} (${job.vehicle_reg_no})`);
  lines.push(`Service date: ${fmtDate(job.completed_at || job.updated_at || job.created_at)}`);
  lines.push('');
  lines.push('*Service details:*');
  (job.items || []).forEach((it: any) => {
    lines.push(`- ${it.name} x${it.qty || 1}  ${inr((it.price || 0) * (it.qty || 1))}`);
  });
  lines.push('');
  lines.push(`*Total: ${inr(job.total || 0)}*`);
  if (garage?.telephone) lines.push(`Contact us: ${garage.telephone}`);
  lines.push('');
  lines.push('We appreciate your business!');
  return lines.join('\n');
}

export function reminderMessage(job: any, garage: any): string {
  const svcDate = fmtDate(job.completed_at || job.updated_at || job.created_at);
  const items = (job.items || []).map((it: any) => it.name).slice(0, 5).join(', ');
  return [
    `Hi ${job.customer_name},`,
    ``,
    `It has been 2 months since your last service at *${garage?.garage_name || 'our garage'}* on ${svcDate}.`,
    `Previous service: ${items || 'general service'}.`,
    `Vehicle: ${job.vehicle_brand} ${job.vehicle_model} (${job.vehicle_reg_no}).`,
    ``,
    `Please schedule your next check-up.`,
    garage?.telephone ? `Call us: ${garage.telephone}` : '',
  ].filter(Boolean).join('\n');
}

export async function openWhatsApp(phone: string, message: string) {
  const url = buildWaLink(phone, message);
  const ok = await Linking.canOpenURL(url);
  if (ok || Platform.OS === 'web') {
    await Linking.openURL(url);
    return true;
  }
  return false;
}
