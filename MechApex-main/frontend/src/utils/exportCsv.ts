import { Platform } from 'react-native';
import { fmtDate } from './format';

function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export async function downloadCsv(filename: string, csvContent: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const FileSystem = require('expo-file-system');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sharing = require('expo-sharing');
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${filename}`,
          UTI: 'public.comma-separated-values-text',
        });
      }
    } catch (e) {
      console.error('Export CSV error:', e);
    }
  }
}

export async function exportCustomersCsv(customers: any[]): Promise<void> {
  const headers = [
    'Customer Name',
    'Mobile Number',
    'Total Jobs',
    'Total Revenue (INR)',
    'Registered Vehicles',
    'Last Visit Date',
  ];

  const rows = customers.map((c) => {
    const vehiclesStr = (c.vehicles || [])
      .map((v: any) => `${v.reg_no || ''} (${v.brand || ''} ${v.model || ''})`.trim())
      .join('; ');

    return [
      c.name || 'Unknown',
      c.phone ? `'${c.phone}` : '',
      c.job_count || 0,
      c.total_spent ? Number(c.total_spent).toFixed(2) : '0.00',
      vehiclesStr,
      c.last_visit ? fmtDate(c.last_visit) : '',
    ];
  });

  const csv = generateCsv(headers, rows);
  const dateStr = new Date().toISOString().split('T')[0];
  await downloadCsv(`MechApex_Customers_${dateStr}.csv`, csv);
}

export async function exportJobsCsv(jobs: any[]): Promise<void> {
  const headers = [
    'Job Card ID',
    'Date Created',
    'Status',
    'Customer Name',
    'Customer Mobile',
    'Vehicle Type',
    'Brand',
    'Model',
    'Registration No',
    'Odometer (km)',
    'Complaint',
    'Services Selected',
    'Total Amount (INR)',
    'Timer (Seconds)',
    'Completed At',
  ];

  const rows = jobs.map((j) => {
    const servicesStr = (j.services || [])
      .map((s: any) => `${s.name} (Qty: ${s.qty || 1}, Rs.${s.price})`)
      .join('; ');

    return [
      j.job_card_no || j.id || '',
      j.created_at ? fmtDate(j.created_at) : '',
      j.status ? j.status.toUpperCase() : '',
      j.customer_name || '',
      j.customer_phone ? `'${j.customer_phone}` : '',
      j.vehicle_class === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler',
      j.vehicle_brand || '',
      j.vehicle_model || '',
      j.vehicle_reg_no || '',
      j.odometer || '',
      j.complaint || '',
      servicesStr,
      j.total ? Number(j.total).toFixed(2) : '0.00',
      j.timer_seconds || 0,
      j.completed_at ? fmtDate(j.completed_at) : '',
    ];
  });

  const csv = generateCsv(headers, rows);
  const dateStr = new Date().toISOString().split('T')[0];
  await downloadCsv(`MechApex_Job_Cards_${dateStr}.csv`, csv);
}
