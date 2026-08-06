import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform,
  Modal, ActivityIndicator, FlatList, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from '@/src/theme';
import { api, getUser, saveUser } from '@/src/api';

const UPI_ID = '8904600880@upi';
const UPI_NAME = 'MechApex';
const UPI_NOTE = 'MechApex Worker Plan';

const WORKER_PACKAGES = [
  {
    id: 'worker_10',
    title: '10 Extra Workers',
    workers: 10,
    price: 99,
    color: colors.brandPrimary,
    description: 'Add 10 more mechanics or workers to your team.',
  },
  {
    id: 'worker_100',
    title: '100 Extra Workers',
    workers: 100,
    price: 799,
    color: '#8B5CF6',
    description: 'Scale your team with 100 additional workers.',
  },
];

export default function SubUsers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dl, setDl] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [relievingDate, setRelievingDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Worker upgrade modal state
  const [upiConfirmOpen, setUpiConfirmOpen] = useState(false);
  const [pendingPkg, setPendingPkg] = useState<any>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [newWorkerLimit, setNewWorkerLimit] = useState(0);

  const load = useCallback(async () => {
    try {
      const [subusers, u] = await Promise.all([api.listSubusers(), getUser()]);
      setItems(subusers as any);
      setUser(u);
    } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const workerLimit = user?.worker_limit ?? 10;
  const workerCount = items.length;
  const limitReached = workerCount >= workerLimit;
  const progressPct = Math.min((workerCount / workerLimit) * 100, 100);
  const progressColor = progressPct >= 100 ? '#DC2626' : progressPct >= 80 ? '#D97706' : colors.success;

  async function save() {
    setErr(null);
    if (!name) return setErr('Name is required');
    if (phone.replace(/\D/g, '').length < 10) return setErr('Valid mobile is required');
    if (!aadhar) return setErr('Aadhar number is required');
    if (limitReached) {
      setErr(`Worker limit reached (${workerCount}/${workerLimit}). Please upgrade to add more workers.`);
      return;
    }
    setSaving(true);
    try {
      await api.createSubuser({
        name,
        phone: phone.replace(/\D/g, ''),
        dl_num: dl || null,
        aadhar_num: aadhar,
        joining_date: joiningDate || undefined,
        relieving_date: relievingDate || undefined,
      });
      setName(''); setPhone(''); setDl(''); setAadhar('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setRelievingDate('');
      setAddOpen(false);
      load();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function toggleRelieved(item: any) {
    const isRelieved = item.status === 'relieved' || !!item.relieving_date;
    const today = new Date().toISOString().split('T')[0];
    if (isRelieved) {
      await api.patchSubuser(item.id, { status: 'active', relieving_date: null });
    } else {
      await api.patchSubuser(item.id, { status: 'relieved', relieving_date: today });
    }
    load();
  }

  async function del(id: string) {
    await api.deleteSubuser(id);
    load();
  }

  async function handleWorkerUpgrade(pkg: any) {
    setPendingPkg(pkg);
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${pkg.price}&cu=INR&tn=${encodeURIComponent(UPI_NOTE + ' - ' + pkg.title)}`;
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        await Linking.openURL(`https://upipay.in/?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${pkg.price}`);
      }
    } catch {
      // Show confirm dialog even if UPI app not found
    }
    setUpiConfirmOpen(true);
  }

  async function confirmWorkerPaymentDone() {
    if (!pendingPkg) return;
    setUpiConfirmOpen(false);
    setUpgrading(true);
    try {
      const res = await api.upgradePackage(pendingPkg.id);
      const newLimit = res.worker_limit || ((user?.worker_limit ?? 10) + pendingPkg.workers);
      setNewWorkerLimit(newLimit);
      const freshUser = await api.me();
      await saveUser(freshUser);
      setUser(freshUser);
      setSuccessOpen(true);
      load();
    } catch (e: any) {
      Alert.alert('Upgrade Error', e?.message || 'Could not complete package upgrade. Please contact support.');
    } finally {
      setUpgrading(false);
      setPendingPkg(null);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="subusers-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="subusers-back"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={s.headerTitle}>Workers</Text>
        <Pressable
          onPress={() => {
            if (limitReached) {
              Alert.alert(
                'Worker Limit Reached',
                `You have used ${workerCount}/${workerLimit} workers. Upgrade below to add more.`,
              );
            } else {
              setAddOpen(true);
            }
          }}
          testID="subusers-add"
        >
          <Ionicons name="add" size={26} color={limitReached ? colors.muted : colors.brandPrimary} />
        </Pressable>
      </View>

      {/* Worker limit banner */}
      <View style={s.limitBanner}>
        <View style={s.limitRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.limitLabel}>WORKERS USED</Text>
            <Text style={[s.limitValue, { color: limitReached ? '#DC2626' : colors.onSurface }]}>
              {workerCount} / {workerLimit}
            </Text>
          </View>
          <Ionicons
            name={limitReached ? 'alert-circle' : 'people'}
            size={28}
            color={limitReached ? '#DC2626' : colors.brandPrimary}
          />
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressBar, { width: `${progressPct}%` as any, backgroundColor: progressColor }]} />
        </View>
        {limitReached && (
          <Text style={s.limitWarning}>⚠ Worker limit reached. Upgrade below to add more workers.</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8 }}>No workers yet</Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                Add mechanics or workers — they can log in with the mobile number you add.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={s.upgradeSection}>
              <Text style={s.upgradeSectionTitle}>UPGRADE WORKER PLAN</Text>
              <Text style={s.upgradeSectionSub}>Need more workers? Choose a plan below.</Text>
              {WORKER_PACKAGES.map((pkg) => (
                <View key={pkg.id} style={s.upgradePkgCard} testID={`worker-pkg-${pkg.id}`}>
                  <View style={s.upgradePkgLeft}>
                    <Text style={s.upgradePkgTitle}>{pkg.title}</Text>
                    <Text style={s.upgradePkgDesc}>{pkg.description}</Text>
                  </View>
                  <View style={s.upgradePkgRight}>
                    <Text style={[s.upgradePkgPrice, { color: pkg.color }]}>₹{pkg.price}</Text>
                    <Pressable
                      style={[s.upgradePkgBtn, { backgroundColor: pkg.color }, upgrading && { opacity: 0.6 }]}
                      onPress={() => handleWorkerUpgrade(pkg)}
                      disabled={upgrading}
                      testID={`buy-worker-pkg-${pkg.id}`}
                    >
                      {upgrading && pendingPkg?.id === pkg.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={s.upgradePkgBtnText}>Upgrade</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => {
            const isRelieved = item.status === 'relieved' || !!item.relieving_date;
            return (
              <View style={[s.card, isRelieved && s.relievedCard]} testID={`subuser-${item.id}`}>
                <View style={[s.avatar, isRelieved && { backgroundColor: '#E2E8F0' }]}>
                  <Text style={{ color: isRelieved ? colors.muted : colors.onBrandTertiary, fontWeight: '800' }}>
                    {item.name?.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.name, isRelieved && { color: colors.muted }]}>{item.name}</Text>
                    <View style={[s.badge, isRelieved ? s.relievedBadge : s.activeBadge]}>
                      <Text style={[s.badgeText, isRelieved ? s.relievedBadgeText : s.activeBadgeText]}>
                        {isRelieved ? 'Relieved' : 'Active'}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.sub}>+91 {item.phone}</Text>
                  {item.dl_num ? <Text style={s.sub}>DL: {item.dl_num}</Text> : null}
                  <Text style={s.sub}>Aadhar: {item.aadhar_num?.slice(-4).padStart(item.aadhar_num?.length || 12, '•')}</Text>
                  
                  <View style={s.dateRow}>
                    <Text style={s.dateText}>📅 Joined: {item.joining_date || 'N/A'}</Text>
                    {item.relieving_date ? (
                      <Text style={[s.dateText, { color: colors.error }]}>🚪 Relieved: {item.relieving_date}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ gap: 10, alignItems: 'center' }}>
                  <Pressable
                    style={[s.relieveBtn, isRelieved && s.reactivateBtn]}
                    onPress={() => toggleRelieved(item)}
                    testID={`subuser-toggle-relieved-${item.id}`}
                  >
                    <Ionicons
                      name={isRelieved ? 'refresh-circle' : 'ban-outline'}
                      size={18}
                      color={isRelieved ? colors.success : colors.warning}
                    />
                  </Pressable>
                  <Pressable onPress={() => del(item.id)} testID={`subuser-del-${item.id}`}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add Worker Modal */}
      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)} />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.sheet}>
              <View style={s.grabber} />
              <Text style={s.sheetTitle}>Add Worker</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: spacing.md }}>
                They can log in with the mobile number below via OTP unless relieved.
              </Text>

              <MField label="Name *" value={name} onChangeText={setName} testID="sub-name" />
              <MField label="Mobile Number *" value={phone} onChangeText={(v: string) => setPhone(v.replace(/\D/g, ''))} keyboardType="phone-pad" testID="sub-phone" maxLength={10} />
              <MField label="Driving License No" value={dl} onChangeText={setDl} testID="sub-dl" autoCapitalize="characters" />
              <MField label="Aadhar Number *" value={aadhar} onChangeText={(v: string) => setAadhar(v.replace(/\D/g, ''))} keyboardType="number-pad" testID="sub-aadhar" maxLength={12} />
              
              <MField label="Date of Joining (YYYY-MM-DD) *" value={joiningDate} onChangeText={setJoiningDate} testID="sub-joining-date" placeholder="YYYY-MM-DD" />
              <MField label="Date of Relieving (YYYY-MM-DD, Optional)" value={relievingDate} onChangeText={setRelievingDate} testID="sub-relieving-date" placeholder="Leave empty if active" />

              {err && <Text style={{ color: colors.error, marginBottom: 6, fontSize: 13 }}>{err}</Text>}

              <Pressable style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving} testID="sub-save">
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Add Worker</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* UPI Confirm Modal for Worker Upgrade */}
      <Modal visible={upiConfirmOpen} transparent animationType="fade" onRequestClose={() => setUpiConfirmOpen(false)}>
        <View style={s.upiModalBg}>
          <View style={s.upiModalCard}>
            <View style={s.upiIconWrap}>
              <Ionicons name="phone-portrait-outline" size={36} color={colors.brandPrimary} />
            </View>
            <Text style={s.upiModalTitle}>Complete Payment</Text>
            <Text style={s.upiModalDesc}>
              Pay <Text style={{ fontWeight: '800', color: colors.brandPrimary }}>₹{pendingPkg?.price}</Text> to:
            </Text>
            <View style={s.upiBox}>
              <Ionicons name="qr-code" size={20} color={colors.brandPrimary} />
              <View style={{ marginLeft: 8 }}>
                <Text style={s.upiId}>{UPI_ID}</Text>
                <Text style={s.upiNote}>{UPI_NAME}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
              After paying in your UPI app, tap below to activate your worker plan.
            </Text>
            <Pressable style={s.upiConfirmBtn} onPress={confirmWorkerPaymentDone} testID="worker-upi-confirm-paid">
              <Text style={s.upiConfirmBtnText}>✓ I Have Paid — Activate Plan</Text>
            </Pressable>
            <Pressable style={s.upiCancelBtn} onPress={() => { setUpiConfirmOpen(false); setPendingPkg(null); }} testID="worker-upi-confirm-cancel">
              <Text style={s.upiCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successOpen} transparent animationType="fade" onRequestClose={() => setSuccessOpen(false)}>
        <View style={s.upiModalBg}>
          <View style={s.upiModalCard}>
            <View style={{ marginBottom: spacing.md }}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={s.upiModalTitle}>Worker Plan Upgraded!</Text>
            <Text style={s.upiModalDesc}>
              Your team limit has been increased to{' '}
              <Text style={{ fontWeight: '800', color: colors.brandPrimary }}>{newWorkerLimit} Workers</Text>.
            </Text>
            <Pressable style={s.upiConfirmBtn} onPress={() => setSuccessOpen(false)} testID="worker-upgrade-success-close">
              <Text style={s.upiConfirmBtnText}>Back to Workers</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MField({ label, ...p }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...p}
        placeholderTextColor={colors.muted}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },

  limitBanner: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  limitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  limitLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1 },
  limitValue: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
  limitWarning: { fontSize: 11, color: '#DC2626', marginTop: 6, fontWeight: '600' },

  empty: { alignItems: 'center', padding: spacing.xxl, marginTop: 40 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surfaceSecondary,
    padding: spacing.md, borderRadius: radius.md, marginBottom: 8, ...shadow.card,
  },
  relievedCard: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.onSurface },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  dateRow: { marginTop: 6, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  dateText: { fontSize: 11, color: colors.onSurfaceSecondary, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  activeBadge: { backgroundColor: '#DCFCE7' },
  activeBadgeText: { color: '#166534', fontSize: 10, fontWeight: '800' },
  relievedBadge: { backgroundColor: '#FEE2E2' },
  relievedBadgeText: { color: '#991B1B', fontSize: 10, fontWeight: '800' },
  relieveBtn: { padding: 4 },
  reactivateBtn: { opacity: 0.9 },

  // Upgrade Worker Section
  upgradeSection: {
    marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  upgradeSectionTitle: {
    fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1.2, marginBottom: 4,
  },
  upgradeSectionSub: { fontSize: 13, color: colors.onSurfaceSecondary, marginBottom: spacing.md },
  upgradePkgCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  upgradePkgLeft: { flex: 1, paddingRight: spacing.sm },
  upgradePkgTitle: { fontSize: 15, fontWeight: '800', color: colors.onSurface },
  upgradePkgDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  upgradePkgRight: { alignItems: 'flex-end', gap: 6 },
  upgradePkgPrice: { fontSize: 20, fontWeight: '800' },
  upgradePkgBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center',
  },
  upgradePkgBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Add Worker Modal
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },

  // UPI / Worker Upgrade Modals
  upiModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  upiModalCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', width: '100%' },
  upiIconWrap: { marginBottom: spacing.md, width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  upiBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 12, width: '100%', borderWidth: 1, borderColor: colors.brandPrimary },
  upiId: { fontSize: 16, fontWeight: '800', color: colors.brandPrimary },
  upiNote: { fontSize: 12, color: colors.muted, marginTop: 2 },
  upiModalTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface, textAlign: 'center', marginBottom: 8 },
  upiModalDesc: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing.md },
  upiConfirmBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 8 },
  upiConfirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  upiCancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  upiCancelBtnText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
});
