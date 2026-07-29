import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }
  return 'http://10.152.69.48:8000';
}

const BASE = getBaseUrl();
const TOKEN_KEY = 'gf_token';
const USER_KEY = 'gf_user';

async function getToken() { return AsyncStorage.getItem(TOKEN_KEY); }

export async function setSession(token: string, user: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}
export async function clearSession() { await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]); }
export async function getUser(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function saveUser(u: any) { await AsyncStorage.setItem(USER_KEY, JSON.stringify(u)); }
export async function isAuthed() { return !!(await getToken()); }

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', ...(opts.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.detail || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as any;
  return res.json();
}

export const api = {
  sendOtp: (phone: string) => req('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone: string, otp: string, name?: string) =>
    req('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, otp, name }) }),
  me: () => req('/auth/me'),
  updateProfile: (body: any) => req('/profile', { method: 'PUT', body: JSON.stringify(body) }),

  listSubusers: () => req('/subusers'),
  createSubuser: (body: any) => req('/subusers', { method: 'POST', body: JSON.stringify(body) }),
  patchSubuser: (id: string, body: any) => req(`/subusers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteSubuser: (id: string) => req(`/subusers/${id}`, { method: 'DELETE' }),

  catalog: () => req('/catalog'),
  upgradePackage: (package_id: string) => req('/upgrade', { method: 'POST', body: JSON.stringify({ package_id }) }),

  listJobs: (status?: string) => req(`/jobs${status && status !== 'all' ? `?status_filter=${status}` : ''}`),
  createJob: (body: any) => req('/jobs', { method: 'POST', body: JSON.stringify(body) }),
  getJob: (id: string) => req(`/jobs/${id}`),
  patchJob: (id: string, body: any) => req(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteJob: (id: string) => req(`/jobs/${id}`, { method: 'DELETE' }),
  timer: (id: string, action: 'start' | 'pause' | 'stop') =>
    req(`/jobs/${id}/timer`, { method: 'POST', body: JSON.stringify({ action }) }),
  addPhoto: (id: string, body: any) => req(`/jobs/${id}/photos`, { method: 'POST', body: JSON.stringify(body) }),
  deletePhoto: (jid: string, pid: string) => req(`/jobs/${jid}/photos/${pid}`, { method: 'DELETE' }),

  reminders: () => req('/reminders'),
  dismissReminder: (id: string) => req(`/reminders/${id}/dismiss`, { method: 'PATCH' }),

  listCustomers: () => req('/customers'),
  createCustomer: (body: any) => req('/customers', { method: 'POST', body: JSON.stringify(body) }),
  lookupCustomer: (phone: string) => req(`/customers/lookup?phone=${encodeURIComponent(phone)}`),

  listServices: () => req('/services'),
  createService: (body: any) => req('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: string, body: any) => req(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteService: (id: string) => req(`/services/${id}`, { method: 'DELETE' }),

  analytics: (year?: number, month?: number) => {
    const qs = [year ? `year=${year}` : '', month ? `month=${month}` : ''].filter(Boolean).join('&');
    return req(`/analytics${qs ? `?${qs}` : ''}`);
  },

  dashboard: () => req('/dashboard'),
};

export { BASE };
