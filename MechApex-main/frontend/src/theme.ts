import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_PRESETS: Record<string, { name: string; primary: string; secondary: string; tertiary: string; onTertiary: string }> = {
  ruby: { name: 'Ruby Red', primary: '#BE123C', secondary: '#F43F5E', tertiary: '#FFE4E6', onTertiary: '#881337' },
  blue: { name: 'MechApex Blue', primary: '#2563EB', secondary: '#3B82F6', tertiary: '#DBEAFE', onTertiary: '#1E40AF' },
  green: { name: 'Emerald Green', primary: '#059669', secondary: '#10B981', tertiary: '#D1FAE5', onTertiary: '#065F46' },
  purple: { name: 'Royal Purple', primary: '#7C3AED', secondary: '#8B5CF6', tertiary: '#EDE9FE', onTertiary: '#5B21B6' },
  orange: { name: 'Sunset Orange', primary: '#EA580C', secondary: '#F97316', tertiary: '#FFEDD5', onTertiary: '#9A3412' },
  dark: { name: 'Dark Midnight', primary: '#0F172A', secondary: '#334155', tertiary: '#E2E8F0', onTertiary: '#0F172A' },
};

export const colors = {
  surface: '#F3F4F6',
  onSurface: '#111827',
  surfaceSecondary: '#FFFFFF',
  onSurfaceSecondary: '#1F2937',
  surfaceTertiary: '#E5E7EB',
  onSurfaceTertiary: '#374151',
  surfaceInverse: '#111827',
  onSurfaceInverse: '#F9FAFB',
  brand: '#BE123C',
  brandPrimary: '#BE123C',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#F43F5E',
  brandTertiary: '#FFE4E6',
  onBrandTertiary: '#881337',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#475569',
  border: '#E5E7EB',
  borderStrong: '#9CA3AF',
  muted: '#6B7280',
  whatsapp: '#25D366',
};

export async function applyTheme(presetKey: string) {
  const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.ruby;
  colors.brand = preset.primary;
  colors.brandPrimary = preset.primary;
  colors.brandSecondary = preset.secondary;
  colors.brandTertiary = preset.tertiary;
  colors.onBrandTertiary = preset.onTertiary;
  try {
    await AsyncStorage.setItem('app_theme_preset', presetKey);
  } catch {}
}

export async function initTheme() {
  try {
    const saved = await AsyncStorage.getItem('app_theme_preset');
    if (saved && THEME_PRESETS[saved]) {
      applyTheme(saved);
    }
  } catch {}
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const font = { sm: 12, base: 14, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const shadow = {
  card: {
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8, elevation: 2,
  },
  raised: {
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12, elevation: 4,
  },
};

export const statusMeta: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', fg: '#1E40AF', dot: '#2563EB' },
  ready: { label: 'Ready', bg: '#F3E8FF', fg: '#6B21A8', dot: '#9333EA' },
  completed: { label: 'Completed', bg: '#DCFCE7', fg: '#166534', dot: '#16A34A' },
};

