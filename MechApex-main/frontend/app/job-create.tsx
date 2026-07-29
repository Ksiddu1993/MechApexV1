import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from '@/src/theme';
import { api } from '@/src/api';
import { inr } from '@/src/utils/format';
import { INDIAN_FOUR_WHEELERS, INDIAN_TWO_WHEELERS, FUEL_TYPES } from '@/src/constants/vehicleCatalog';

type Picker = null | 'brand' | 'model' | 'fuel' | 'service';

export default function JobCreate() {
  const { vc, st } = useLocalSearchParams<{ vc: 'two_wheeler' | 'four_wheeler'; st: 'service' | 'washing' }>();
  const [catalog, setCatalog] = useState<any>(null);
  const [picker, setPicker] = useState<Picker>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [regNo, setRegNo] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('');
  const [odometer, setOdometer] = useState('');
  const [complaint, setComplaint] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  // Customer Auto-Lookup & Select States
  const [savedCustomers, setSavedCustomers] = useState<any[]>([]);
  const [custPickerOpen, setCustPickerOpen] = useState(false);
  const [autofillNotice, setAutofillNotice] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.catalog().then(setCatalog).catch(() => {});
    api.listCustomers().then((list) => setSavedCustomers(list as any[])).catch(() => {});
  }, []);

  const applyCustomerData = useCallback((cust: any) => {
    if (!cust) return;
    if (cust.name) setCustomerName(cust.name);
    if (cust.phone) setCustomerPhone(cust.phone);

    // Pick matching vehicle or first available vehicle
    const vehicles = cust.vehicles || [];
    const matchVeh = vehicles.find((v: any) => v.class === vc) || vehicles[0];

    if (matchVeh) {
      if (matchVeh.brand) setBrand(matchVeh.brand);
      if (matchVeh.model) setModel(matchVeh.model);
      if (matchVeh.reg_no) setRegNo(matchVeh.reg_no);
      if (matchVeh.fuel) setFuel(matchVeh.fuel);
      if (matchVeh.year) setYear(String(matchVeh.year));
    }
    setAutofillNotice(`✓ Auto-filled details for ${cust.name || 'customer'}`);
  }, [vc]);

  // Handle phone change & auto-lookup
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setCustomerPhone(clean);
    setAutofillNotice(null);

    if (clean.length === 10) {
      setLookingUp(true);
      api.lookupCustomer(clean)
        .then((res) => {
          if (res?.found && res?.customer) {
            applyCustomerData(res.customer);
          }
        })
        .catch(() => {})
        .finally(() => setLookingUp(false));
    }
  };

  const indianMap = vc === 'two_wheeler' ? INDIAN_TWO_WHEELERS : INDIAN_FOUR_WHEELERS;
  const catalogBrands = catalog ? Object.keys(catalog[vc] || {}) : [];
  const brands = Array.from(new Set([...Object.keys(indianMap), ...catalogBrands]));

  const indianModels = brand ? (indianMap[brand] || []) : [];
  const catalogModels = brand && catalog ? (catalog[vc][brand] || []) : [];
  const models = Array.from(new Set([...indianModels, ...catalogModels]));

  const fuels = Array.from(new Set([...FUEL_TYPES, ...(catalog?.fuel_types || [])]));
  const defaultServices = catalog
    ? (vc === 'two_wheeler' ? catalog.default_services_two_wheeler : catalog.default_services_four_wheeler)
    : [];
  const filteredServices = st === 'washing'
    ? defaultServices.filter((x: any) => x.category === 'wash')
    : defaultServices;

  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

  function addService(svc: any) {
    setItems((prev) => [...prev, { ...svc, qty: 1 }]);
    setPicker(null);
  }
  function updateItem(i: number, patch: any) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addCustom() {
    const p = parseFloat(customPrice);
    if (!customName || isNaN(p)) return;
    setItems((prev) => [...prev, { name: customName, category: st === 'washing' ? 'wash' : 'service', price: p, qty: 1 }]);
    setCustomName(''); setCustomPrice('');
  }

  async function save() {
    setErr(null);
    if (!customerName || !customerPhone) return setErr('Customer name and phone are required');
    if (!brand || !model) return setErr('Vehicle brand and model are required');
    if (!regNo) return setErr('Vehicle registration number is required');
    setSaving(true);
    try {
      const body = {
        vehicle_class: vc,
        service_type: st,
        customer_name: customerName,
        customer_phone: customerPhone.replace(/\D/g, ''),
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_reg_no: regNo,
        vehicle_year: year ? parseInt(year) : null,
        fuel: fuel || null,
        odometer: odometer ? parseInt(odometer) : null,
        complaint,
        items,
      };
      const created: any = await api.createJob(body);
      router.replace(`/job/${created.id}`);
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="job-create-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} testID="jc-back" hitSlop={12}><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>New Job Card</Text>
            <Text style={s.headerSub}>{vc === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler'} · {st === 'washing' ? 'Washing' : 'Service'}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: 6 }}>
            <SectionTitle title="CUSTOMER DETAILS" />
            <Pressable
              style={s.selectCustBtn}
              onPress={() => setCustPickerOpen(true)}
              testID="jc-select-saved-customer"
            >
              <Ionicons name="people" size={14} color={colors.brandPrimary} />
              <Text style={s.selectCustBtnText}>Select Saved</Text>
            </Pressable>
          </View>

          {autofillNotice && (
            <View style={s.autofillBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={s.autofillText}>{autofillNotice}</Text>
            </View>
          )}

          <Field label="Customer Name" value={customerName} onChangeText={setCustomerName} testID="jc-cust-name" placeholder="Full name" />

          <Field label="Mobile Number" value={customerPhone} onChangeText={handlePhoneChange} keyboardType="phone-pad" testID="jc-cust-phone" placeholder="10-digit mobile number" maxLength={10} />
          {lookingUp && <ActivityIndicator size="small" color={colors.brandPrimary} style={{ alignSelf: 'flex-start', marginBottom: 8 }} />}


          <SectionTitle title="VEHICLE DETAILS" />
          <LabelPicker label="Brand" value={brand} placeholder="Select brand" onPress={() => setPicker('brand')} testID="jc-brand-picker" />
          <LabelPicker label="Model" value={model} placeholder={brand ? 'Select model' : 'Pick brand first'} onPress={() => brand && setPicker('model')} testID="jc-model-picker" />
          <Field label="Registration No" value={regNo} onChangeText={(v: string) => setRegNo(v.toUpperCase().replace(/\s/g, ''))} testID="jc-reg-no" placeholder="KA01AB1234" autoCapitalize="characters" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" testID="jc-year" placeholder="2020" maxLength={4} /></View>
            <View style={{ flex: 1 }}><Field label="Odometer (km)" value={odometer} onChangeText={setOdometer} keyboardType="number-pad" testID="jc-odo" placeholder="0" /></View>
          </View>
          <LabelPicker label="Fuel Type" value={fuel} placeholder="Select fuel" onPress={() => setPicker('fuel')} testID="jc-fuel-picker" />

          <SectionTitle title="COMPLAINT / NOTES" />
          <TextInput
            testID="jc-complaint"
            value={complaint}
            onChangeText={setComplaint}
            placeholder="What's the customer reporting?"
            placeholderTextColor={colors.muted}
            multiline
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
          />

          <SectionTitle title={`ITEMS · ${inr(total)}`} />

          {items.length === 0 && (
            <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
              Add services or parts. Prices can be edited per item.
            </Text>
          )}

          {items.map((it, i) => (
            <View key={i} style={s.item} testID={`jc-item-${i}`}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.itemName}>{it.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>₹</Text>
                  <TextInput
                    value={String(it.price)}
                    onChangeText={(v) => updateItem(i, { price: parseFloat(v) || 0 })}
                    keyboardType="numeric"
                    style={s.priceInput}
                    testID={`jc-item-price-${i}`}
                  />
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>Qty</Text>
                  <TextInput
                    value={String(it.qty)}
                    onChangeText={(v) => updateItem(i, { qty: parseInt(v) || 1 })}
                    keyboardType="number-pad"
                    style={[s.priceInput, { width: 40 }]}
                    testID={`jc-item-qty-${i}`}
                  />
                </View>
              </View>
              <Text style={s.itemAmt}>{inr((it.price || 0) * (it.qty || 1))}</Text>
              <Pressable onPress={() => removeItem(i)} testID={`jc-item-del-${i}`} hitSlop={8}>
                <Ionicons name="close-circle" size={22} color={colors.muted} />
              </Pressable>
            </View>
          ))}

          <Pressable style={s.addBtn} onPress={() => setPicker('service')} testID="jc-add-service">
            <Ionicons name="add-circle" size={20} color={colors.brandPrimary} />
            <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>Add from catalog</Text>
          </Pressable>

          <View style={s.customRow}>
            <TextInput
              placeholder="Custom item name"
              placeholderTextColor={colors.muted}
              value={customName}
              onChangeText={setCustomName}
              style={[s.input, { flex: 2 }]}
              testID="jc-custom-name"
            />
            <TextInput
              placeholder="Price ₹"
              placeholderTextColor={colors.muted}
              value={customPrice}
              onChangeText={setCustomPrice}
              keyboardType="numeric"
              style={[s.input, { flex: 1 }]}
              testID="jc-custom-price"
            />
            <Pressable style={s.customAddBtn} onPress={addCustom} testID="jc-add-custom">
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          </View>

          {err && <Text style={s.err} testID="jc-error">{err}</Text>}
        </ScrollView>

        <View style={s.footer}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: colors.muted, letterSpacing: 0.5, fontWeight: '700' }}>ESTIMATED TOTAL</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.onSurface, marginTop: 2 }}>{inr(total)}</Text>
          </View>
          <Pressable
            style={[s.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
            testID="jc-create-btn"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Create Job Card</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Catalog & Brand Pickers */}
      <PickerModal
        visible={picker === 'brand'}
        title="Select Vehicle Brand"
        data={brands.map((b) => ({ id: b, label: b }))}
        onSelect={(it: any) => { setBrand(it.id); setModel(''); setPicker(null); }}
        onClose={() => setPicker(null)}
        testIDPrefix="jc-brand"
      />
      <PickerModal
        visible={picker === 'model'}
        title={`Select ${brand} Model`}
        data={models.map((m: string) => ({ id: m, label: m }))}
        onSelect={(it: any) => { setModel(it.id); setPicker(null); }}
        onClose={() => setPicker(null)}
        testIDPrefix="jc-model"
      />
      <PickerModal
        visible={picker === 'fuel'}
        title="Select Fuel Type"
        data={fuels.map((f: string) => ({ id: f, label: f }))}
        onSelect={(it: any) => { setFuel(it.id); setPicker(null); }}
        onClose={() => setPicker(null)}
        testIDPrefix="jc-fuel"
      />
      <PickerModal
        visible={picker === 'service'}
        title="Add Service / Part"
        data={filteredServices.map((x: any) => ({
          id: x.name,
          label: `${x.name} (${x.category}) · ₹${x.price}`,
          raw: x,
        }))}
        onSelect={(it: any) => addService(it.raw)}
        onClose={() => setPicker(null)}
        testIDPrefix="jc-service"
      />

      {/* Saved Customer Selector Modal */}
      <Modal visible={custPickerOpen} transparent animationType="slide" onRequestClose={() => setCustPickerOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCustPickerOpen(false)} />
          <View style={s.sheet}>
            <View style={s.grabber} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={s.sheetTitle}>Select Saved Customer</Text>
              <Pressable onPress={() => setCustPickerOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <FlatList
              data={savedCustomers}
              keyExtractor={(item) => item.phone}
              style={{ maxHeight: 400 }}
              ListEmptyComponent={<Text style={{ color: colors.muted, padding: 16, textAlign: 'center' }}>No saved customers found</Text>}
              renderItem={({ item }) => (
                <Pressable
                  style={s.custRow}
                  onPress={() => {
                    applyCustomerData(item);
                    setCustPickerOpen(false);
                  }}
                  testID={`select-cust-${item.phone}`}
                >
                  <View style={s.custAvatar}>
                    <Text style={s.custAvatarText}>{(item.name || 'C').slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.onSurface, fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>+91 {item.phone}</Text>
                    {item.vehicles?.length > 0 && (
                      <Text style={{ color: colors.brandPrimary, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                        {item.vehicles[0].reg_no} ({item.vehicles[0].brand} {item.vehicles[0].model})
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}
function Field({ label, value, onChangeText, testID, placeholder, keyboardType, maxLength, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={s.input}
      />
    </View>
  );
}
function LabelPicker({ label, value, placeholder, onPress, testID }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={onPress} style={s.pickerBtn} testID={testID}>
        <Text style={{ color: value ? colors.onSurface : colors.muted, fontSize: 15 }}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}
function PickerModal({ visible, title, data, onSelect, onClose, testIDPrefix }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <Text style={s.sheetTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(i) => String(i.id)}
            style={{ maxHeight: 460 }}
            ListEmptyComponent={<Text style={{ color: colors.muted, padding: 16 }}>No options</Text>}
            renderItem={({ item }) => (
              <Pressable style={s.pmItem} onPress={() => onSelect(item)} testID={`${testIDPrefix}-${item.id}`}>
                <Text style={{ color: colors.onSurface, fontSize: 15 }}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm, gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.onSurface },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 2, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.2 },
  selectCustBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandTertiary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.md },
  selectCustBtnText: { color: colors.brandPrimary, fontSize: 12, fontWeight: '700' },
  autofillBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', padding: 10, borderRadius: radius.md, marginBottom: 10 },
  autofillText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  pickerBtn: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceSecondary,
    padding: spacing.md, borderRadius: radius.md, marginBottom: 8, ...shadow.card,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.onSurface },
  priceInput: {
    minWidth: 60, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border, fontSize: 13, color: colors.onSurface,
    backgroundColor: colors.surface,
  },
  itemAmt: { fontWeight: '800', color: colors.onSurface, fontSize: 14, minWidth: 60, textAlign: 'right' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: colors.brandTertiary, padding: 12, borderRadius: radius.md, marginTop: 4,
  },
  customRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  customAddBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  err: { color: colors.error, marginTop: 8, fontSize: 13 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 8 },
  pmItem: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  custAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brandTertiary, alignItems: 'center', justifyContent: 'center' },
  custAvatarText: { color: colors.brandPrimary, fontWeight: '800', fontSize: 15 },
});
