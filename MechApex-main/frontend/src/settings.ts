import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gf_settings';

export type Settings = { sound: boolean; notifications: boolean };
const defaults: Settings = { sound: true, notifications: true };

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export async function saveSettings(s: Partial<Settings>) {
  const cur = await getSettings();
  const next = { ...cur, ...s };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
