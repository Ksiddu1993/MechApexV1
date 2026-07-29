import { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from '@/src/theme';
import { api, getUser, saveUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { StatusBadge } from '@/src/components/StatusBadge';
import { useLang } from '@/src/i18n';
import { inr } from '@/src/utils/format';

const TWO_WHEELER_IMG = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop';
const FOUR_WHEELER_IMG = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop';

export default function Home() {
  const { t } = useLang();
  const [user, setUser] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);
  const [refresh, setRefresh] = useState(false);

  // Onboarding Modal state for first-time login
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [obOwnerName, setObOwnerName] = useState('');
  const [obGarageName, setObGarageName] = useState('');
  const [obPhone, setObPhone] = useState('');
  const [obAddress, setObAddress] = useState('');
  const [obGstin, setObGstin] = useState('');
  const [savingOb, setSavingOb] = useState(false);
  const [obErr, setObErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([getUser(), api.dashboard()]);
      setUser(u); setDash(d);

      // Check first-time login onboarding for owners
      if (u && u.role === 'main' && (!u.garage_name || !u.name)) {
        setObOwnerName(u.name || '');
        setObGarageName(u.garage_name || '');
        setObPhone(u.telephone || u.phone || '');
        setObAddress(u.address || '');
        setObGstin(u.gstin || '');
        setOnboardingOpen(true);
      }
    } catch {}
    setRefresh(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSaveOnboarding() {
    setObErr(null);
    if (!obOwnerName.trim()) return setObErr('Owner name is required');
    if (!obGarageName.trim()) return setObErr('Garage name is required');
    if (!obPhone.trim()) return setObErr('Contact telephone number is required');

    setSavingOb(true);
    try {
      const updated = await api.updateProfile({
        name: obOwnerName.trim(),
        garage_name: obGarageName.trim(),
        telephone: obPhone.trim(),
        address: obAddress.trim(),
        gstin: obGstin.trim(),
      });
      await saveUser(updated);
      setUser(updated);
      setOnboardingOpen(false);
      load();
    } catch (e: any) {
      setObErr(e?.message || 'Could not save garage details');
    } finally {
      setSavingOb(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="home-screen">
      <AppHeader name={user?.name} photo={user?.photo_base64} garage_name={user?.garage_name} />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
      >
        <Text style={s.section}>Choose vehicle type</Text>

        <View style={s.selectorRow}>
          <VehicleCard
            title={t('two_wheeler')}
            image={TWO_WHEELER_IMG}
            onPress={() => router.push('/service-select?vc=two_wheeler')}
            testID="home-two-wheeler"
          />
          <VehicleCard
            title={t('four_wheeler')}
            image={FOUR_WHEELER_IMG}
            onPress={() => router.push('/service-select?vc=four_wheeler')}
            testID="home-four-wheeler"
          />
        </View>

        {/* KPI strip */}
        <View style={s.kpiRow}>
          <MiniKpi label={t('pending')} value={dash?.counts?.pending ?? 0} color={colors.warning} />
          <MiniKpi label={t('in_progress')} value={dash?.counts?.in_progress ?? 0} color={'#1E40AF'} />
          <MiniKpi label={t('ready')} value={dash?.counts?.ready ?? 0} color={'#6B21A8'} />
          <MiniKpi label={t('completed')} value={dash?.counts?.completed ?? 0} color={colors.success} />
        </View>

        {user?.role === 'main' && (
          <View style={s.revenueCard}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 1 }}>REVENUE</Text>
              <Text style={{ color: colors.onSurface, fontSize: 26, fontWeight: '800', marginTop: 4 }}>
                {inr(dash?.revenue || 0)}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {dash?.jobs_today || 0} job(s) created today
              </Text>
            </View>
            <View style={s.revIcon}>
              <Ionicons name="trending-up" size={24} color={colors.success} />
            </View>
          </View>
        )}

        <View style={s.sectionHeader}>
          <Text style={s.section}>{t('recent_jobs')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/jobs')} testID="see-all-jobs">
            <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>See all</Text>
          </Pressable>
        </View>

        {(dash?.recent || []).length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="clipboard-outline" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 8 }}>No job cards yet</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>Tap a vehicle type above or "+ New Job Card" to start</Text>
          </View>
        ) : (
          (dash?.recent || []).map((j: any) => (
            <Pressable
              key={j.id}
              style={s.jobCard}
              onPress={() => router.push(`/job/${j.id}`)}
              testID={`home-job-${j.id}`}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={j.vehicle_class === 'two_wheeler' ? 'bicycle' : 'car-sport'}
                    size={16}
                    color={colors.brandPrimary}
                  />
                  <Text style={s.jobRegNo}>{j.vehicle_reg_no}</Text>
                  {j.job_card_no ? (
                    <Text style={s.jcNoTag}>{j.job_card_no}</Text>
                  ) : null}
                </View>
                <Text style={s.jobTitle} numberOfLines={1}>{j.vehicle_brand} {j.vehicle_model}</Text>
                <Text style={s.jobCust}>{j.customer_name} • {inr(j.total)}</Text>
              </View>
              <StatusBadge status={j.status} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* First-Time Login Garage Setup Onboarding Modal */}
      <Modal visible={onboardingOpen} transparent animationType="slide" onRequestClose={() => {}}>
        <View style={s.modalWrap}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.sheet}>
              <View style={s.grabber} />
              <Text style={s.sheetTitle}>🎉 Welcome to MechApex!</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 16 }}>
                Please set up your Garage Profile details to get started.
              </Text>

              {obErr && (
                <View style={s.errBanner}>
                  <Text style={s.errText}>{obErr}</Text>
                </View>
              )}

              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Owner Name *</Text>
                <TextInput
                  style={s.input}
                  value={obOwnerName}
                  onChangeText={setObOwnerName}
                  placeholder="Your Full Name"
                  placeholderTextColor={colors.muted}
                  testID="ob-owner-name"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Garage Name *</Text>
                <TextInput
                  style={s.input}
                  value={obGarageName}
                  onChangeText={setObGarageName}
                  placeholder="e.g. Apex Auto Garage"
                  placeholderTextColor={colors.muted}
                  testID="ob-garage-name"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Telephone / Contact Phone *</Text>
                <TextInput
                  style={s.input}
                  value={obPhone}
                  onChangeText={(v) => setObPhone(v.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile"
                  placeholderTextColor={colors.muted}
                  testID="ob-phone"
                />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Garage Address & City *</Text>
                <TextInput
                  style={[s.input, { height: 60, textAlignVertical: 'top' }]}
                  value={obAddress}
                  onChangeText={setObAddress}
                  placeholder="Street, Area, City"
                  placeholderTextColor={colors.muted}
                  multiline
                  testID="ob-address"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={s.label}>GSTIN (Optional)</Text>
                <TextInput
                  style={s.input}
                  value={obGstin}
                  onChangeText={setObGstin}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  testID="ob-gstin"
                />
              </View>

              <Pressable
                style={[s.primaryBtn, savingOb && { opacity: 0.6 }]}
                onPress={handleSaveOnboarding}
                disabled={savingOb}
                testID="ob-submit-btn"
              >
                {savingOb ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save & Complete Setup</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function VehicleCard({ title, image, onPress, testID }: any) {
  return (
    <Pressable style={s.vCard} onPress={onPress} testID={testID}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(17,24,39,0.05)', 'rgba(17,24,39,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.vCardInner}>
        <Text style={s.vCardTitle}>{title}</Text>
        <View style={s.vCardArrow}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

function MiniKpi({ label, value, color }: any) {
  return (
    <View style={s.kpi}>
      <View style={[s.kpiDot, { backgroundColor: color }]} />
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  quickActionsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md, marginTop: 4 },
  quickActionCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.md, borderRadius: radius.lg, ...shadow.card,
  },
  quickActionIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  quickActionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 1 },
  section: { fontSize: 16, fontWeight: '800', color: colors.onSurface, marginTop: 4, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  selectorRow: { flexDirection: 'row', gap: 12 },
  vCard: { flex: 1, height: 130, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  vCardInner: { flex: 1, padding: spacing.md, justifyContent: 'flex-end' },
  vCardTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  vCardArrow: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  kpiRow: { flexDirection: 'row', gap: 8, marginTop: spacing.lg },
  kpi: { flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  kpiDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
  kpiLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  revenueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: spacing.md, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg, padding: spacing.lg, ...shadow.card,
  },
  revIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
  },
  jobCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 8, ...shadow.card,
  },
  jobRegNo: { color: colors.onSurface, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  jcNoTag: { fontSize: 10, fontWeight: '800', color: colors.brandPrimary, backgroundColor: colors.brandTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  jobTitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  jobCust: { color: colors.muted, fontSize: 12, marginTop: 2 },
  empty: {
    alignItems: 'center', padding: spacing.xxl,
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, ...shadow.card,
  },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 10, fontSize: 14, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errBanner: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: radius.md, marginBottom: 12 },
  errText: { color: colors.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
