import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { fmtDate } from '@/src/utils/format';
import { openWhatsApp, reminderMessage } from '@/src/utils/whatsapp';

export default function Reminders() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, u] = await Promise.all([api.reminders(), getUser()]);
      setItems(r as any); setUser(u);
    } catch {}
    setLoading(false); setRefresh(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function callCustomer(phone: string) {
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  }

  async function dismiss(id: string) {
    await api.dismissReminder(id);
    load();
  }

  async function sendReminder(job: any) {
    const msg = reminderMessage(job, user);
    await openWhatsApp(job.customer_phone, msg);
    await api.dismissReminder(job.id);
    load();
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="reminders-screen">
      <AppHeader name={user?.name} photo={user?.photo_base64} title="Follow-up Reminders" showBack={true} />
      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="notifications-off-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8 }}>No pending reminders</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Reminders are auto-created 2 months after each completed service.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.card, item.due && s.dueCard]} testID={`reminder-${item.id}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.dot, { backgroundColor: item.due ? colors.error : colors.warning }]} />
                <Text style={s.due}>{item.due ? 'Due now' : `Due on ${fmtDate(item.reminder_at)}`}</Text>
              </View>
              <Text style={s.name}>{item.customer_name}</Text>
              <Text style={s.sub}>
                {item.vehicle_brand} {item.vehicle_model} • {item.vehicle_reg_no}
              </Text>
              <Text style={s.svcDate}>Last service: {fmtDate(item.completed_at || item.created_at)}</Text>

              <View style={s.actions}>
                <Pressable style={s.callBtn} onPress={() => callCustomer(item.customer_phone)} testID={`rem-call-${item.id}`}>
                  <Ionicons name="call" size={16} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>Call</Text>
                </Pressable>
                <Pressable style={s.waBtn} onPress={() => sendReminder(item)} testID={`rem-wa-${item.id}`}>
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700' }}>WhatsApp</Text>
                </Pressable>
                <Pressable style={s.dismissBtn} onPress={() => dismiss(item.id)} testID={`rem-dismiss-${item.id}`}>
                  <Ionicons name="close" size={16} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  card: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, ...shadow.card, borderLeftWidth: 4, borderLeftColor: colors.warning,
  },
  dueCard: { borderLeftColor: colors.error, backgroundColor: '#FEF2F2' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  due: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  name: { color: colors.onSurface, fontSize: 17, fontWeight: '800', marginTop: 8 },
  sub: { color: colors.onSurfaceSecondary, fontSize: 13, marginTop: 2 },
  svcDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.md, alignItems: 'center' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandTertiary,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md,
  },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.whatsapp,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, flex: 1, justifyContent: 'center',
  },
  dismissBtn: { padding: 10, borderRadius: radius.md, backgroundColor: colors.surface },
  empty: { alignItems: 'center', padding: spacing.xxl, marginTop: 40 },
});
