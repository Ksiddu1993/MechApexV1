import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { StatusBadge } from '@/src/components/StatusBadge';
import { inr, fmtDate } from '@/src/utils/format';

import { exportJobsCsv } from '@/src/utils/exportCsv';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsList() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<any[]>([]);
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, u] = await Promise.all([api.listJobs(filter), getUser()]);
      const jobList = Array.isArray(res) ? res : (res?.jobs || []);
      setItems(jobList);
      setUser(u);
      const limit = u?.job_card_limit || 100;
      setLimitInfo({ total_count: jobList.length, limit, limit_reached: jobList.length >= limit });
    } catch {}
    setLoading(false); setRefresh(false);
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleExport() {
    if (items.length === 0) {
      Alert.alert('No Data', 'There are no job cards to export.');
      return;
    }
    setExporting(true);
    try {
      await exportJobsCsv(items);
      // On web the download triggers automatically; on mobile the share sheet opens.
      // No additional alert needed — the OS handles it.
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export job cards. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="jobs-screen">
      <AppHeader
        name={user?.name}
        photo={user?.photo_base64}
        title="Job Cards"
        rightAction={
          <Pressable
            style={[s.headerExportBtn, (exporting || items.length === 0) && { opacity: 0.5 }]}
            onPress={handleExport}
            disabled={exporting || items.length === 0}
            testID="export-jobs-csv"
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.brandPrimary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={16} color={colors.brandPrimary} />
                <Text style={s.headerExportText}>Export CSV</Text>
              </>
            )}
          </Pressable>
        }
      />

      {limitInfo?.limit_reached && user?.role === 'main' && (
        <Pressable
          style={s.upgradeNotice}
          onPress={() => router.push('/upgrade')}
          testID="jobs-upgrade-banner"
        >
          <Ionicons name="alert-circle" size={20} color="#991B1B" />
          <View style={{ flex: 1 }}>
            <Text style={s.upgradeNoticeTitle}>
              Job Card Limit Reached ({limitInfo.total_count}/{limitInfo.limit})
            </Text>
            <Text style={s.upgradeNoticeSub}>
              Upgrade your package to unlock 500, 1000, or 5000 job cards.
            </Text>
          </View>
          <View style={s.upgradeNoticeBtn}>
            <Text style={s.upgradeNoticeBtnText}>Upgrade</Text>
          </View>
        </Pressable>
      )}

      <View style={s.topBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg }}
          style={s.chipsRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[s.chip, filter === f.key && s.chipActive]}
              testID={`jobs-filter-${f.key}`}
            >
              <Text style={[s.chipText, filter === f.key && s.chipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 8, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
          ListEmptyComponent={
            <View style={s.empty} testID="jobs-empty">
              <Ionicons name="clipboard-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8, fontSize: 15 }}>No job cards yet</Text>
              <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>Start from Home → pick a vehicle type</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={s.card} onPress={() => router.push(`/job/${item.id}`)} testID={`job-card-${item.id}`}>
              <View style={s.cardHeader}>
                <View style={s.cardHeaderLeft}>
                  <Ionicons
                    name={item.vehicle_class === 'two_wheeler' ? 'bicycle' : 'car-sport'}
                    size={18}
                    color={colors.brandPrimary}
                  />
                  <Text style={s.regNo}>{item.vehicle_reg_no}</Text>
                  {item.job_card_no ? (
                    <View style={s.jcBadge}>
                      <Text style={s.jcBadgeText}>{item.job_card_no}</Text>
                    </View>
                  ) : null}
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={s.cardBody}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.custName}>{item.customer_name || 'Customer'}</Text>
                  {item.customer_phone ? <Text style={s.custPhone}>{item.customer_phone}</Text> : null}
                </View>
                <View style={s.pill}>
                  <Text style={s.pillText}>{item.service_type === 'washing' ? 'Wash' : 'Service'}</Text>
                </View>
              </View>

              <View style={s.cardFooter}>
                <Text style={s.footerLeft}>{fmtDate(item.created_at)}</Text>
                <Text style={s.footerRight}>{inr(item.total || 0)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  upgradeNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEE2E2',
    marginHorizontal: spacing.lg, marginTop: 4, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: '#FCA5A5',
  },
  upgradeNoticeTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  upgradeNoticeSub: { fontSize: 11, color: '#7F1D1D', marginTop: 1 },
  upgradeNoticeBtn: { backgroundColor: '#991B1B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  upgradeNoticeBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  headerExportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 38, paddingHorizontal: 12, borderRadius: 19,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  headerExportText: { color: colors.onSurface, fontSize: 12, fontWeight: '700' },
  topBar: {
    marginVertical: 4,
  },
  chipsRow: { maxHeight: 56, paddingVertical: 4 },
  chip: {
    height: 34, paddingHorizontal: 14, borderRadius: 17,
    backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurfaceSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8, flexWrap: 'wrap',
  },
  regNo: { fontSize: 15, fontWeight: '800', color: colors.onSurface, letterSpacing: 0.5 },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.xs,
  },
  pill: {
    backgroundColor: colors.brandTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  jcBadge: {
    backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    borderWidth: 1, borderColor: colors.brandPrimary,
  },
  jcBadgeText: { color: colors.brandPrimary, fontSize: 10, fontWeight: '800' },
  custName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  custPhone: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  footerLeft: { color: colors.muted, fontSize: 12 },
  footerRight: { color: colors.onSurface, fontWeight: '800', fontSize: 15 },
  empty: { alignItems: 'center', padding: spacing.xxl },
});

