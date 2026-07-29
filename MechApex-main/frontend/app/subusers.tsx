import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform,
  Modal, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from '@/src/theme';
import { api } from '@/src/api';

export default function SubUsers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dl, setDl] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [relievingDate, setRelievingDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems(await api.listSubusers() as any); } catch {}
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setErr(null);
    if (!name) return setErr('Name is required');
    if (phone.replace(/\D/g, '').length < 10) return setErr('Valid mobile is required');
    if (!aadhar) return setErr('Aadhar number is required');
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
      // Reactivate
      await api.patchSubuser(item.id, { status: 'active', relieving_date: null });
    } else {
      // Relieve
      await api.patchSubuser(item.id, { status: 'relieved', relieving_date: today });
    }
    load();
  }

  async function del(id: string) {
    await api.deleteSubuser(id);
    load();
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="subusers-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="subusers-back"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={s.headerTitle}>Workers</Text>
        <Pressable onPress={() => setAddOpen(true)} testID="subusers-add"><Ionicons name="add" size={26} color={colors.brandPrimary} /></Pressable>
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
});
