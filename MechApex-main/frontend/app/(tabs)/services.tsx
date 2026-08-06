import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { inr } from '@/src/utils/format';

type SvcItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  vehicle_class: string;
};

const CATEGORIES = ['service', 'part', 'wash'];
const VEHICLE_CLASSES = ['two_wheeler', 'four_wheeler', 'both'];

const CATEGORY_COLORS: Record<string, string> = {
  service: '#3B82F6',
  part: '#8B5CF6',
  wash: '#06B6D4',
};

const CATEGORY_ICONS: Record<string, any> = {
  service: 'construct',
  part: 'hardware-chip',
  wash: 'water',
};

const VC_LABEL: Record<string, string> = {
  two_wheeler: '2-Wheeler',
  four_wheeler: '4-Wheeler',
  both: 'All Vehicles',
};

export default function Services() {
  const [items, setItems] = useState<SvcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<'two_wheeler' | 'four_wheeler' | 'both'>('four_wheeler');
  const [query, setQuery] = useState('');

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SvcItem | null>(null);
  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState('service');
  const [fPrice, setFPrice] = useState('');
  const [fVehicleClass, setFVehicleClass] = useState('four_wheeler');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const u = await getUser();
      if (u?.role === 'sub') {
        router.replace('/home');
        return;
      }
      const data = await api.listServices();
      setItems(data as SvcItem[]);
    } catch {}
    setLoading(false);
    setRefresh(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openAdd() {
    setEditing(null);
    setFName('');
    setFCategory('service');
    setFPrice('');
    setFVehicleClass(activeTab === 'both' ? 'both' : activeTab);
    setFormErr(null);
    setModalOpen(true);
  }

  function openEdit(item: SvcItem) {
    setEditing(item);
    setFName(item.name);
    setFCategory(item.category);
    setFPrice(String(item.price));
    setFVehicleClass(item.vehicle_class);
    setFormErr(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setFormErr(null);
    if (!fName.trim()) return setFormErr('Service name is required');
    const price = parseFloat(fPrice);
    if (isNaN(price) || price < 0) return setFormErr('Enter a valid price');

    setSaving(true);
    try {
      if (editing) {
        await api.updateService(editing.id, { name: fName.trim(), category: fCategory, price, vehicle_class: fVehicleClass });
      } else {
        await api.createService({ name: fName.trim(), category: fCategory, price, vehicle_class: fVehicleClass });
      }
      setModalOpen(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || 'Could not save service');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: SvcItem) {
    Alert.alert(
      'Delete Service',
      `Remove "${item.name}" from your catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteService(item.id);
              load();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Could not delete');
            }
          },
        },
      ]
    );
  }

  // Filter by tab and search
  const filtered = items.filter((item) => {
    const vcMatch =
      activeTab === 'both'
        ? true
        : item.vehicle_class === activeTab || item.vehicle_class === 'both';
    const qMatch = query
      ? item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      : true;
    return vcMatch && qMatch;
  });

  // Group by category
  const grouped: Record<string, SvcItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const sections = Object.entries(grouped);

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="services-screen">
      <AppHeader
        title="Service Catalog"
        rightAction={
          <Pressable style={s.addBtn} onPress={openAdd} testID="add-service-btn">
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.addBtnText}>Add Item</Text>
          </Pressable>
        }
      />

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search services or parts..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Vehicle Class Tabs */}
      <View style={s.tabRow}>
        {(['four_wheeler', 'two_wheeler', 'both'] as const).map((vc) => (
          <Pressable
            key={vc}
            style={[s.tab, activeTab === vc && s.tabActive]}
            onPress={() => setActiveTab(vc)}
          >
            <Ionicons
              name={vc === 'two_wheeler' ? 'bicycle' : vc === 'four_wheeler' ? 'car-sport' : 'apps'}
              size={14}
              color={activeTab === vc ? '#fff' : colors.muted}
            />
            <Text style={[s.tabText, activeTab === vc && s.tabTextActive]}>
              {VC_LABEL[vc]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <Text style={s.statsText}>
          <Text style={{ fontWeight: '800', color: colors.onSurface }}>{filtered.length}</Text>
          {' '}items · {sections.length} categories
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
        >
          {sections.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="construct-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                {query ? 'No matching services found' : 'No services yet. Tap "Add Item" to get started.'}
              </Text>
            </View>
          ) : (
            sections.map(([cat, catItems]) => (
              <View key={cat} style={{ marginBottom: spacing.lg }}>
                {/* Category header */}
                <View style={s.catHeader}>
                  <View style={[s.catIconWrap, { backgroundColor: CATEGORY_COLORS[cat] || '#6B7280' }]}>
                    <Ionicons name={CATEGORY_ICONS[cat] || 'pricetag'} size={14} color="#fff" />
                  </View>
                  <Text style={s.catLabel}>{cat.toUpperCase()}</Text>
                  <Text style={s.catCount}>{catItems.length}</Text>
                </View>

                {catItems.map((item) => (
                  <View key={item.id} style={s.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={[s.vcBadge, { backgroundColor: item.vehicle_class === 'two_wheeler' ? '#EDE9FE' : item.vehicle_class === 'four_wheeler' ? '#DBEAFE' : '#D1FAE5' }]}>
                          <Text style={[s.vcBadgeText, { color: item.vehicle_class === 'two_wheeler' ? '#7C3AED' : item.vehicle_class === 'four_wheeler' ? '#1D4ED8' : '#065F46' }]}>
                            {VC_LABEL[item.vehicle_class] || item.vehicle_class}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={s.price}>{inr(item.price)}</Text>
                    <View style={s.actions}>
                      <Pressable
                        style={s.editBtn}
                        onPress={() => openEdit(item)}
                        testID={`edit-service-${item.id}`}
                        hitSlop={8}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.brandPrimary} />
                      </Pressable>
                      <Pressable
                        style={s.delBtn}
                        onPress={() => handleDelete(item)}
                        testID={`del-service-${item.id}`}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.sheet}>
              <View style={s.grabber} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={s.sheetTitle}>{editing ? 'Edit Service' : 'Add New Service'}</Text>
                <Pressable onPress={() => setModalOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>

              {formErr && (
                <View style={s.errBanner}>
                  <Text style={s.errText}>{formErr}</Text>
                </View>
              )}

              <Text style={s.label}>Service / Item Name *</Text>
              <TextInput
                style={s.input}
                value={fName}
                onChangeText={setFName}
                placeholder="e.g. Engine Oil Change"
                placeholderTextColor={colors.muted}
                testID="svc-name-input"
              />

              <Text style={s.label}>Price (₹) *</Text>
              <TextInput
                style={s.input}
                value={fPrice}
                onChangeText={setFPrice}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                testID="svc-price-input"
              />

              <Text style={s.label}>Category</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[s.pill, fCategory === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
                    onPress={() => setFCategory(cat)}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[cat]}
                      size={13}
                      color={fCategory === cat ? '#fff' : colors.muted}
                    />
                    <Text style={[s.pillText, fCategory === cat && { color: '#fff' }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.label}>Applies To</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {VEHICLE_CLASSES.map((vc) => (
                  <Pressable
                    key={vc}
                    style={[s.pill, fVehicleClass === vc && s.pillActive]}
                    onPress={() => setFVehicleClass(vc)}
                  >
                    <Ionicons
                      name={vc === 'two_wheeler' ? 'bicycle' : vc === 'four_wheeler' ? 'car-sport' : 'apps'}
                      size={13}
                      color={fVehicleClass === vc ? '#fff' : colors.muted}
                    />
                    <Text style={[s.pillText, fVehicleClass === vc && { color: '#fff' }]}>
                      {VC_LABEL[vc]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[s.primaryBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                testID="svc-save-btn"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>{editing ? 'Save Changes' : 'Add to Catalog'}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, ...shadow.card,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 9, gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginBottom: 6 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary,
  },
  tabActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: '#fff' },
  statsRow: { paddingHorizontal: spacing.lg, paddingBottom: 4 },
  statsText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 8,
  },
  catIconWrap: {
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1.2, flex: 1 },
  catCount: { fontSize: 11, fontWeight: '700', color: colors.muted, backgroundColor: colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md,
    padding: spacing.md, marginBottom: 8, ...shadow.card,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  vcBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  vcBadgeText: { fontSize: 10, fontWeight: '700' },
  price: { fontSize: 15, fontWeight: '800', color: colors.onSurface, minWidth: 70, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 4 },
  delBtn: { padding: 4 },
  empty: { alignItems: 'center', padding: spacing.xxl, marginTop: 30 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 40,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 11, fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  pillText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errBanner: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: radius.md, marginBottom: 12 },
  errText: { color: colors.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
