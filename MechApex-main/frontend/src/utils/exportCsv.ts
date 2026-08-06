import { Platform, Alert } from 'react-native';
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
      const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const fileUri = `${dir.endsWith('/') ? dir : dir + '/'}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        const shareOpts: any = {
          mimeType: 'text/csv',
          dialogTitle: `Export ${filename}`,
        };
        if (Platform.OS === 'ios') {
          shareOpts.UTI = 'public.comma-separated-values-text';
        }
        await Sharing.shareAsync(fileUri, shareOpts);
      } else {
        Alert.alert('Sharing Not Available', 'Your device does not support file sharing. Please use the web version to export CSV.');
      }
    } catch (e: any) {
      console.error('Export CSV error:', e);
      Alert.alert('Export Failed', e?.message || 'Could not export file. Please try again.');
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
    const serviceItems = j.items || j.services || j.services_selected || [];
    const servicesStr = (Array.isArray(serviceItems) ? serviceItems : [])
      .map((s: any) => {
        if (!s) return '';
        if (typeof s === 'string') return s;
        const name = s.name || s.category || s.title || 'Item';
        const price = s.price !== undefined && s.price !== null ? `Rs.${s.price}` : '';
        const qty = s.qty ? `Qty: ${s.qty}` : '';
        const details = [qty, price].filter(Boolean).join(', ');
        return details ? `${name} (${details})` : name;
      })
      .filter(Boolean)
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
