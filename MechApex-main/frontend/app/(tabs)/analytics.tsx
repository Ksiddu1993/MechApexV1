import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { inr, fmtDate } from '@/src/utils/format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [sort, setSort] = useState<'date' | 'price'>('date');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([getUser(), api.analytics(year, month || undefined)]);
      setUser(u); setData(d);
    } catch {}
    setLoading(false); setRefresh(false);
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const jobs = (data?.jobs || []).slice().sort((a: any, b: any) => {
    if (sort === 'price') return (b.total || 0) - (a.total || 0);
    return new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime();
  });

  const maxBar = Math.max(1, ...((data?.by_month || []) as number[]));

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="analytics-screen">
      <AppHeader name={user?.name} photo={user?.photo_base64} title="Analytics" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
      >
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={s.summaryLabel}>REVENUE</Text>
            <Text style={[s.summaryValue, { color: '#166534' }]}>{inr(data?.total_revenue || 0)}</Text>
          </View>
          <View style={[s.summaryCard, { backgroundColor: colors.brandTertiary }]}>
            <Text style={s.summaryLabel}>VEHICLES</Text>
            <Text style={[s.summaryValue, { color: colors.onBrandTertiary }]}>{data?.vehicle_count || 0}</Text>
          </View>
        </View>

        <Text style={s.section}>Revenue by month · {year}</Text>
        <View style={s.chart}>
          {(data?.by_month || Array(12).fill(0)).map((v: number, i: number) => (
            <Pressable
              key={i}
              onPress={() => setMonth(month === i + 1 ? null : i + 1)}
              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 2 }}
              testID={`chart-bar-${i}`}
            >
              <View style={{ height: 120, justifyContent: 'flex-end', width: '100%' }}>
                <View
                  style={{
                    height: Math.max(4, (v / maxBar) * 110),
                    backgroundColor: month === i + 1 ? colors.brandPrimary : colors.brandTertiary,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={[s.monthLabel, month === i + 1 && { color: colors.brandPrimary, fontWeight: '800' }]}>
                {MONTHS[i]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={s.filterRow}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setYear(year - 1)}
              style={s.yearBtn}
              testID="analytics-prev-year"
            >
              <Ionicons name="chevron-back" size={16} color={colors.onSurface} />
            </Pressable>
            <View style={s.yearPill}><Text style={{ fontWeight: '700', color: colors.onSurface }}>{year}</Text></View>
            <Pressable
              onPress={() => setYear(year + 1)}
              style={s.yearBtn}
              testID="analytics-next-year"
            >
              <Ionicons name="chevron-forward" size={16} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setSort('date')}
              style={[s.sortChip, sort === 'date' && s.sortChipActive]}
              testID="sort-date"
            >
              <Text style={[s.sortChipText, sort === 'date' && { color: '#fff' }]}>Date</Text>
            </Pressable>
            <Pressable
              onPress={() => setSort('price')}
              style={[s.sortChip, sort === 'price' && s.sortChipActive]}
              testID="sort-price"
            >
              <Text style={[s.sortChipText, sort === 'price' && { color: '#fff' }]}>Price</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.section}>{month ? `${MONTHS[month - 1]} ${year}` : `All completed in ${year}`}</Text>
        {loading ? (
          <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 20 }} />
        ) : jobs.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 8 }}>No completed jobs</Text>
          </View>
        ) : (
          jobs.map((j: any) => (
            <Pressable key={j.id} style={s.row} onPress={() => router.push(`/job/${j.id}`)} testID={`analytics-job-${j.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowName}>{j.customer_name}</Text>
                <Text style={s.rowSub}>{j.vehicle_brand} {j.vehicle_model} • {j.vehicle_reg_no}</Text>
                <Text style={s.rowDate}>{fmtDate(j.completed_at || j.created_at)}</Text>
              </View>
              <Text style={s.rowAmt}>{inr(j.total)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  section: { fontSize: 15, fontWeight: '800', color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.onSurfaceSecondary },
  summaryValue: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  chart: {
    flexDirection: 'row', backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'flex-end', ...shadow.card,
  },
  monthLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
  filterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg,
  },
  yearBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
  yearPill: {
    minWidth: 70, paddingHorizontal: 12, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', ...shadow.card,
  },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  sortChipText: { color: colors.onSurfaceSecondary, fontWeight: '600', fontSize: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary,
    padding: spacing.md, borderRadius: radius.md, marginBottom: 8, ...shadow.card,
  },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowDate: { fontSize: 11, color: colors.muted, marginTop: 4 },
  rowAmt: { fontSize: 15, fontWeight: '800', color: colors.onSurface },
  empty: { alignItems: 'center', padding: spacing.xxl },
});
