import { useCallback, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator,
  TextInput, Linking, Modal, ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { AppHeader } from '@/src/components/AppHeader';
import { inr } from '@/src/utils/format';
import { openWhatsApp } from '@/src/utils/whatsapp';
import { exportCustomersCsv } from '@/src/utils/exportCsv';
import { INDIAN_FOUR_WHEELERS, INDIAN_TWO_WHEELERS, FUEL_TYPES } from '@/src/constants/vehicleCatalog';

export default function Customers() {
  const { openAdd } = useLocalSearchParams<{ openAdd?: string }>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<any>(null);
  const [query, setQuery] = useState('');

  // Add Customer Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [picker, setPicker] = useState<null | 'brand' | 'model' | 'fuel'>(null);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [vClass, setVClass] = useState<'four_wheeler' | 'two_wheeler'>('four_wheeler');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vRegNo, setVRegNo] = useState('');
  const [vFuel, setVFuel] = useState('');
  const [vYear, setVYear] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [modalErr, setModalErr] = useState<string | null>(null);

  useEffect(() => {
    if (openAdd === 'true') {
      setAddModalOpen(true);
    }
  }, [openAdd]);

  const load = useCallback(async () => {
    try {
      const [list, u] = await Promise.all([api.listCustomers(), getUser()]);
      setCustomers(list as any[]);
      setUser(u);
    } catch {}
    setLoading(false);
    setRefresh(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSaveCustomer() {
    setModalErr(null);
    if (!cName.trim()) return setModalErr('Customer name is required');
    const p = cPhone.replace(/\D/g, '');
    if (!p || p.length < 10) return setModalErr('Valid 10-digit mobile number is required');

    setSavingCustomer(true);
    try {
      await api.createCustomer({
        name: cName.trim(),
        phone: p,
        email: cEmail.trim(),
        address: cAddress.trim(),
        notes: cNotes.trim(),
        vehicle_class: vClass,
        vehicle_brand: vBrand.trim(),
        vehicle_model: vModel.trim(),
        vehicle_reg_no: vRegNo.trim().toUpperCase(),
        fuel: vFuel,
        vehicle_year: vYear ? parseInt(vYear, 10) : undefined,
      });
      setAddModalOpen(false);
      // Reset fields
      setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCNotes('');
      setVBrand(''); setVModel(''); setVRegNo(''); setVFuel(''); setVYear('');
      load();
    } catch (e: any) {
      setModalErr(e?.message || 'Could not save customer');
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportCustomersCsv(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  function handleImportCsv() {
    if (Platform.OS === 'web') {
      // Web: use hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvImporting(true);
        try {
          const text = await file.text();
          const rows = text.split('\n').map((r: string) => r.trim()).filter(Boolean);
          // Detect header row
          const startIdx = rows[0]?.toLowerCase().includes('name') ? 1 : 0;
          let imported = 0;
          let skipped = 0;
          for (let i = startIdx; i < rows.length; i++) {
            const cols = rows[i].split(',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
            const name = cols[0];
            const phone = cols[1]?.replace(/\D/g, '');
            if (!name || !phone || phone.length < 10) { skipped++; continue; }
            try {
              await api.createCustomer({ name, phone });
              imported++;
            } catch {
              skipped++;
            }
          }
          setCsvResult({ imported, skipped });
          load();
        } catch (err) {
          Alert.alert('Import Error', 'Could not read CSV file. Please check the format.');
        } finally {
          setCsvImporting(false);
        }
      };
      input.click();
    } else {
      Alert.alert(
        'Import CSV',
        'CSV import is available on the web version of MechApex. Open the app in your browser to use this feature.'
      );
    }
  }

  async function callCustomer(phone: string) {
    const url = `tel:${phone}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  }

  async function chatWhatsApp(phone: string, name: string) {
    const msg = `Hello ${name}, greetings from ${user?.garage_name || 'MechApex'}!`;
    await openWhatsApp(phone, msg);
  }

  const filtered = customers.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const phoneMatch = c.phone?.includes(q);
    const vehicleMatch = c.vehicles?.some(
      (v: any) =>
        v.reg_no?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q)
    );
    return nameMatch || phoneMatch || vehicleMatch;
  });

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="customers-tab-screen">
      <AppHeader
        name={user?.name}
        photo={user?.photo_base64}
        title="Customers"
        rightAction={
          <Pressable
            style={s.addHeaderBtn}
            onPress={() => setAddModalOpen(true)}
            testID="header-add-customer"
          >
            <Ionicons name="person-add" size={16} color="#fff" />
            <Text style={s.addHeaderBtnText}>Add</Text>
          </Pressable>
        }
      />

      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, phone, or vehicle no..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            testID="customer-search-input"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.phone}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} />}
          ListHeaderComponent={
            <View style={s.summaryCard}>
              <View>
                <Text style={s.summaryLabel}>TOTAL CUSTOMERS</Text>
                <Text style={s.summaryValue}>{customers.length}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable
                  style={s.addCardBtn}
                  onPress={() => setAddModalOpen(true)}
                  testID="summary-add-customer"
                >
                  <Ionicons name="person-add-outline" size={15} color={colors.brandPrimary} />
                  <Text style={s.addCardBtnText}>+ Customer</Text>
                </Pressable>

                <Pressable
                  style={[s.importBtn, csvImporting && { opacity: 0.6 }]}
                  onPress={handleImportCsv}
                  disabled={csvImporting}
                  testID="import-customers-csv"
                >
                  {csvImporting ? (
                    <ActivityIndicator size="small" color={colors.brandPrimary} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={15} color={colors.brandPrimary} />
                      <Text style={s.importBtnText}>Import CSV</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[s.exportBtn, exporting && { opacity: 0.6 }]}
                  onPress={handleExport}
                  disabled={exporting || customers.length === 0}
                  testID="export-customers-csv"
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={15} color="#fff" />
                      <Text style={s.exportBtnText}>Export</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 8 }}>
                {query ? 'No matching customers found' : 'No customers recorded yet'}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Tap "+ Add Customer" or create a job card to record customers.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card} testID={`customer-card-${item.phone}`}>
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(item.name || 'C').slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.phone}>+91 {item.phone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.spentVal}>{inr(item.total_spent)}</Text>
                  <Text style={s.jobCount}>{item.job_count} job card(s)</Text>
                </View>
              </View>

              {item.vehicles?.length > 0 && (
                <View style={s.vehicleList}>
                  {item.vehicles.map((v: any, idx: number) => (
                    <View key={idx} style={s.vehicleBadge}>
                      <Ionicons
                        name={v.class === 'two_wheeler' ? 'bicycle' : 'car-sport'}
                        size={12}
                        color={colors.brandPrimary}
                      />
                      <Text style={s.vehicleText}>
                        {v.reg_no} {v.brand ? `(${v.brand} ${v.model || ''})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={s.actions}>
                <Pressable
                  style={s.callBtn}
                  onPress={() => callCustomer(item.phone)}
                  testID={`cust-call-${item.phone}`}
                >
                  <Ionicons name="call" size={15} color={colors.brandPrimary} />
                  <Text style={s.callBtnText}>Call</Text>
                </Pressable>
                <Pressable
                  style={s.waBtn}
                  onPress={() => chatWhatsApp(item.phone, item.name)}
                  testID={`cust-wa-${item.phone}`}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                  <Text style={s.waBtnText}>WhatsApp</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* CSV Import Result Modal */}
      {csvResult && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setCsvResult(null)}>
          <View style={s.modalWrap}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setCsvResult(null)} />
            <View style={[s.sheet, { paddingBottom: 40 }]}>
              <View style={s.grabber} />
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="checkmark-circle" size={52} color={colors.success} />
                <Text style={[s.sheetTitle, { marginTop: 12, textAlign: 'center' }]}>CSV Import Complete</Text>
                <View style={{ flexDirection: 'row', gap: 20, marginTop: 16, marginBottom: 8 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: colors.success }}>{csvResult.imported}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Imported</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: colors.border }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: colors.error }}>{csvResult.skipped}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, fontWeight: '600' }}>Skipped</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 }}>
                  Skipped rows had missing or invalid phone numbers.
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6, textAlign: 'center' }}>
                  CSV format: <Text style={{ fontWeight: '700' }}>name, phone</Text> (one per row)
                </Text>
              </View>
              <Pressable
                style={s.primaryBtn}
                onPress={() => setCsvResult(null)}
              >
                <Text style={s.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Customer Modal */}
      <Modal visible={addModalOpen} transparent animationType="slide" onRequestClose={() => setAddModalOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddModalOpen(false)} />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.sheet}>
              <View style={s.grabber} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={s.sheetTitle}>Add New Customer</Text>
                <Pressable onPress={() => setAddModalOpen(false)} hitSlop={12}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>

              {modalErr && (
                <View style={s.errBanner}>
                  <Text style={s.errText}>{modalErr}</Text>
                </View>
              )}

              <Text style={s.subSectionTitle}>CUSTOMER DETAILS</Text>
              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Customer Name *</Text>
                <TextInput style={s.input} value={cName} onChangeText={setCName} placeholder="Full Name" placeholderTextColor={colors.muted} testID="add-cust-name" />
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={s.label}>Mobile Number *</Text>
                <TextInput style={s.input} value={cPhone} onChangeText={(v) => setCPhone(v.replace(/\D/g, ''))} keyboardType="phone-pad" maxLength={10} placeholder="10-digit mobile" placeholderTextColor={colors.muted} testID="add-cust-phone" />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Email (Optional)</Text>
                  <TextInput style={s.input} value={cEmail} onChangeText={setCEmail} keyboardType="email-address" placeholder="email@domain.com" placeholderTextColor={colors.muted} testID="add-cust-email" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Address / City</Text>
                  <TextInput style={s.input} value={cAddress} onChangeText={setCAddress} placeholder="Area / City" placeholderTextColor={colors.muted} testID="add-cust-address" />
                </View>
              </View>

              <Text style={[s.subSectionTitle, { marginTop: 8 }]}>VEHICLE DETAILS (OPTIONAL)</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <Pressable
                  style={[s.classPill, vClass === 'four_wheeler' && s.classPillActive]}
                  onPress={() => setVClass('four_wheeler')}
                >
                  <Ionicons name="car-sport" size={14} color={vClass === 'four_wheeler' ? '#fff' : colors.onSurface} />
                  <Text style={[s.classPillText, vClass === 'four_wheeler' && s.classPillTextActive]}>Four Wheeler</Text>
                </Pressable>
                <Pressable
                  style={[s.classPill, vClass === 'two_wheeler' && s.classPillActive]}
                  onPress={() => setVClass('two_wheeler')}
                >
                  <Ionicons name="bicycle" size={14} color={vClass === 'two_wheeler' ? '#fff' : colors.onSurface} />
                  <Text style={[s.classPillText, vClass === 'two_wheeler' && s.classPillTextActive]}>Two Wheeler</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Vehicle Brand</Text>
                  <Pressable
                    style={s.pickerBtn}
                    onPress={() => setPicker('brand')}
                    testID="add-v-brand-picker"
                  >
                    <Text style={{ color: vBrand ? colors.onSurface : colors.muted, fontSize: 14 }} numberOfLines={1}>
                      {vBrand || 'Select Brand'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.muted} />
                  </Pressable>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Vehicle Model</Text>
                  <Pressable
                    style={s.pickerBtn}
                    onPress={() => {
                      if (!vBrand) setModalErr('Please select a brand first');
                      else setPicker('model');
                    }}
                    testID="add-v-model-picker"
                  >
                    <Text style={{ color: vModel ? colors.onSurface : colors.muted, fontSize: 14 }} numberOfLines={1}>
                      {vModel || 'Select Model'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Registration No</Text>
                  <TextInput
                    style={s.input}
                    value={vRegNo}
                    onChangeText={(v) => setVRegNo(v.toUpperCase().replace(/\s/g, ''))}
                    autoCapitalize="characters"
                    placeholder="KA01AB1234"
                    placeholderTextColor={colors.muted}
                    testID="add-v-reg"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Fuel Type</Text>
                  <Pressable
                    style={s.pickerBtn}
                    onPress={() => setPicker('fuel')}
                    testID="add-v-fuel-picker"
                  >
                    <Text style={{ color: vFuel ? colors.onSurface : colors.muted, fontSize: 14 }} numberOfLines={1}>
                      {vFuel || 'Select Fuel'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[s.primaryBtn, savingCustomer && { opacity: 0.6 }]}
                onPress={handleSaveCustomer}
                disabled={savingCustomer}
                testID="add-cust-submit"
              >
                {savingCustomer ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save Customer</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Vehicle Catalog Picker Modal */}
      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)} />
          <View style={[s.sheet, { maxHeight: '70%' }]}>
            <View style={s.grabber} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.sheetTitle}>
                {picker === 'brand' ? 'Select Indian Brand' : picker === 'model' ? `Select ${vBrand} Model` : 'Select Fuel Type'}
              </Text>
              <Pressable onPress={() => setPicker(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <FlatList
              data={
                picker === 'brand'
                  ? Object.keys(vClass === 'two_wheeler' ? INDIAN_TWO_WHEELERS : INDIAN_FOUR_WHEELERS)
                  : picker === 'model'
                  ? (vClass === 'two_wheeler' ? INDIAN_TWO_WHEELERS : INDIAN_FOUR_WHEELERS)[vBrand] || []
                  : FUEL_TYPES
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={s.pickerOption}
                  onPress={() => {
                    if (picker === 'brand') {
                      setVBrand(item);
                      setVModel('');
                    } else if (picker === 'model') {
                      setVModel(item);
                    } else if (picker === 'fuel') {
                      setVFuel(item);
                    }
                    setPicker(null);
                  }}
                >
                  <Text style={s.pickerOptionText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  addHeaderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, ...shadow.card,
  },
  addHeaderBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadow.card,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.onBrandTertiary },
  summaryValue: { fontSize: 24, fontWeight: '800', color: colors.onBrandTertiary, marginTop: 4 },
  addCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary,
  },
  addCardBtnText: { color: colors.brandPrimary, fontSize: 12, fontWeight: '700' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, ...shadow.card,
  },
  exportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary,
  },
  importBtnText: { color: colors.brandPrimary, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.onBrandTertiary, fontWeight: '800', fontSize: 16 },
  name: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  phone: { color: colors.muted, fontSize: 12, marginTop: 2 },
  spentVal: { color: colors.success, fontSize: 15, fontWeight: '800' },
  jobCount: { color: colors.muted, fontSize: 11, marginTop: 2 },
  vehicleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  vehicleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
  },
  vehicleText: { fontSize: 11, color: colors.onSurface, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandTertiary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, flex: 1, justifyContent: 'center',
  },
  callBtnText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 13 },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.whatsapp,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, flex: 1, justifyContent: 'center',
  },
  waBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', padding: spacing.xxl, marginTop: 30 },

  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  subSectionTitle: { fontSize: 11, fontWeight: '800', color: colors.muted, letterSpacing: 1, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 10, fontSize: 14, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  classPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  classPillActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  classPillText: { fontSize: 12, fontWeight: '700', color: colors.onSurface },
  classPillTextActive: { color: '#fff' },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errBanner: { backgroundColor: '#FEE2E2', padding: 10, borderRadius: radius.md, marginBottom: 12 },
  errText: { color: colors.error, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 11, borderWidth: 1, borderColor: colors.border,
  },
  pickerOption: {
    paddingVertical: 14, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerOptionText: { fontSize: 15, fontWeight: '600', color: colors.onSurface },
});
