import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { clearSession, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { useLang, setLang } from '@/src/i18n';
import { getSettings, saveSettings, Settings } from '@/src/settings';

export default function More() {
  const [user, setUser] = useState<any>(null);
  const { t, lang } = useLang();
  const [settings, setSettings] = useState<Settings>({ sound: true, notifications: true });

  useEffect(() => {
    getUser().then(setUser);
    getSettings().then(setSettings);
  }, []);

  async function logout() {
    await clearSession();
    router.replace('/login');
  }

  async function toggle(k: keyof Settings) {
    const next = await saveSettings({ [k]: !settings[k] });
    setSettings(next);
  }

  const isMain = user?.role === 'main';

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="more-screen">
      <AppHeader name={user?.name} photo={user?.photo_base64} title={t('more')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>

        <Pressable style={s.profileCard} onPress={() => router.push('/account')} testID="more-account">
          <View style={s.avatarWrap}>
            {user?.photo_base64 ? (
              <View style={[s.avatar, { overflow: 'hidden' }]}>
                {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
                <View style={{ width: '100%', height: '100%', backgroundColor: '#eee' }}>
                  <View style={{ flex: 1 }}>
                    {/* Using Image inside header already handles image, this is placeholder */}
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.avatarPh}>
                <Text style={{ color: colors.onBrandTertiary, fontWeight: '800', fontSize: 20 }}>
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{user?.name || 'Set your name'}</Text>
            <Text style={s.sub}>{user?.role === 'sub' ? 'Worker' : 'Owner'} • {user?.phone}</Text>
            {user?.garage_name ? <Text style={s.sub}>{user.garage_name}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.muted} />
        </Pressable>

        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.section}>
          <Row icon="person-outline" label={t('my_account')} onPress={() => router.push('/account')} testID="more-my-account" />
          {isMain && (
            <Row icon="people-outline" label={t('sub_users')} onPress={() => router.push('/subusers')} testID="more-subusers" />
          )}
          {isMain && (
            <Row icon="construct-outline" label="Service Catalog" onPress={() => router.push('/services')} testID="more-services" />
          )}
          {isMain && (
            <Row icon="bar-chart-outline" label={t('analytics')} onPress={() => router.push('/analytics')} testID="more-analytics" />
          )}
        </View>

        <Text style={s.sectionLabel}>{t('language').toUpperCase()}</Text>
        <View style={s.section}>
          {(['en', 'kn', 'hi'] as const).map((code) => (
            <Pressable
              key={code}
              style={s.langRow}
              onPress={() => setLang(code)}
              testID={`lang-${code}`}
            >
              <Text style={s.langLabel}>
                {code === 'en' ? 'English' : code === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
              </Text>
              {lang === code && <Ionicons name="checkmark-circle" size={20} color={colors.brandPrimary} />}
            </Pressable>
          ))}
        </View>

        <Text style={s.sectionLabel}>{t('settings').toUpperCase()}</Text>
        <View style={s.section}>
          <View style={s.toggleRow}>
            <View style={s.iconWrap}><Ionicons name="volume-high-outline" size={18} color={colors.brandPrimary} /></View>
            <Text style={s.toggleLabel}>Sound</Text>
            <Switch
              value={settings.sound}
              onValueChange={() => toggle('sound')}
              trackColor={{ true: colors.brandPrimary, false: colors.border }}
              thumbColor={'#fff'}
              testID="toggle-sound"
            />
          </View>
          <View style={s.toggleRow}>
            <View style={s.iconWrap}><Ionicons name="notifications-outline" size={18} color={colors.brandPrimary} /></View>
            <Text style={s.toggleLabel}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggle('notifications')}
              trackColor={{ true: colors.brandPrimary, false: colors.border }}
              thumbColor={'#fff'}
              testID="toggle-notifications"
            />
          </View>
        </View>

        {/* Upgrade Package Button right above Logout (Owner only) */}
        {isMain && (
          <Pressable
            style={s.upgradeBtn}
            onPress={() => router.push('/upgrade')}
            testID="more-upgrade-package"
          >
            <View style={s.upgradeIconWrap}>
              <Ionicons name="sparkles" size={20} color="#FFD700" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.upgradeTitle}>Upgrade Package</Text>
              <Text style={s.upgradeSub}>500, 1000 & 5000 Job Card Plans</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        )}

        <Pressable style={s.logoutBtn} onPress={logout} testID="logout-button">
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '700', marginLeft: 8 }}>{t('logout')}</Text>
        </Pressable>

        <Text style={s.version}>MechApex v1.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress, testID }: any) {
  return (
    <Pressable style={s.row} onPress={onPress} testID={testID}>
      <View style={s.iconWrap}><Ionicons name={icon} size={18} color={colors.brandPrimary} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceSecondary, padding: spacing.lg,
    borderRadius: radius.lg, ...shadow.card,
  },
  avatarWrap: {},
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPh: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', color: colors.onSurface },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.2, marginTop: spacing.xl, marginBottom: 8 },
  section: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, ...shadow.card, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.onSurface, fontWeight: '600' },
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  langLabel: { color: colors.onSurface, fontSize: 15, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  toggleLabel: { flex: 1, color: colors.onSurface, fontSize: 15, fontWeight: '600' },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.brandPrimary,
    padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.xl, ...shadow.card,
  },
  upgradeIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  upgradeTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  upgradeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  logoutBtn: {
    marginTop: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  version: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: spacing.xl },
});
