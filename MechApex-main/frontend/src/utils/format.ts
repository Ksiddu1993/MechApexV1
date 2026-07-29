// Helper: format INR
export function inr(n: number | string | undefined): string {
  const v = Number(n || 0);
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
