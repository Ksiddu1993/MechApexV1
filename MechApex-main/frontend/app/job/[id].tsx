import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Alert,
  Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { api, getUser } from '@/src/api';
import { StatusBadge } from '@/src/components/StatusBadge';
import { PhotoAnnotator } from '@/src/components/PhotoAnnotator';
import { inr, fmtDate, fmtTimer } from '@/src/utils/format';
import { openWhatsApp, invoiceMessage } from '@/src/utils/whatsapp';
import { generateAndShareInvoice } from '@/src/utils/invoice';

const NEXT: Record<string, { status: string; label: string }> = {
  pending: { status: 'in_progress', label: 'Start Work' },
  in_progress: { status: 'ready', label: 'Mark Ready' },
  ready: { status: 'completed', label: 'Dispatch & Complete' },
  completed: { status: 'pending', label: 'Reopen' },
};

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [pickerImage, setPickerImage] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<any | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [complaintEdit, setComplaintEdit] = useState<string | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const timerRef = useRef<any>(null);
  const [localTimerRunning, setLocalTimerRunning] = useState(false);
  const [localSeconds, setLocalSeconds] = useState(0);

  const [fullEditOpen, setFullEditOpen] = useState(false);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editRegNo, setEditRegNo] = useState('');
  const [editOdometer, setEditOdometer] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [savingFullEdit, setSavingFullEdit] = useState(false);

  const [itemsEditOpen, setItemsEditOpen] = useState(false);
  const [editItemsList, setEditItemsList] = useState<Array<{ name: string; category?: string; price: number; qty: number }>>([]);
  const [savingItems, setSavingItems] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, u] = await Promise.all([api.getJob(id as string), getUser()]);
      setData(d); setUser(u);
      const job = d.job;
      const running = job?.timer_running;
      setLocalTimerRunning(!!running);
      let base = job?.timer_seconds || 0;
      if (running && job.timer_started_at) {
        base += Math.floor((Date.now() - new Date(job.timer_started_at).getTime()) / 1000);
      }
      setLocalSeconds(base);
    } catch {}
    setLoading(false);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load, refreshTick]));

  // Tick local timer
  useEffect(() => {
    if (localTimerRunning) {
      timerRef.current = setInterval(() => setLocalSeconds((s) => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [localTimerRunning]);

  const job = data?.job;
  const isMain = user?.role === 'main';
  const canEdit = isMain || job?.created_by === user?.id;

  async function nextStatus() {
    if (!job) return;
    const n = NEXT[job.status];
    if (!n) return;
    if (n.status === 'completed') {
      await api.timer(job.id, 'stop');
    }
    await api.patchJob(job.id, { status: n.status });
    setRefreshTick((x) => x + 1);
  }

  async function toggleTimer() {
    if (!job) return;
    if (localTimerRunning) {
      await api.timer(job.id, 'pause');
      setLocalTimerRunning(false);
    } else {
      await api.timer(job.id, 'start');
      setLocalTimerRunning(true);
    }
    setRefreshTick((x) => x + 1);
  }

  async function toggleChecklist(key: string) {
    if (!job) return;
    const next = { ...(job.checklist || {}) };
    next[key] = !next[key];
    await api.patchJob(job.id, { checklist: next });
    setRefreshTick((x) => x + 1);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert(
        'Camera permission',
        'Please enable camera access in Settings to add job photos.',
      );
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    let uri = res.assets[0].uri;
    let base64 = res.assets[0].base64;
    // ensure size manageable
    if (!base64) {
      const manip = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 900 } }], {
        base64: true, compress: 0.6, format: ImageManipulator.SaveFormat.JPEG,
      });
      base64 = manip.base64;
    }
    setPickerImage(`data:image/jpeg;base64,${base64}`);
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Please grant photo access.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5, base64: true, allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    let base64 = res.assets[0].base64;
    if (!base64) {
      const manip = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 900 } }], {
        base64: true, compress: 0.6, format: ImageManipulator.SaveFormat.JPEG,
      });
      base64 = manip.base64;
    }
    setPickerImage(`data:image/jpeg;base64,${base64}`);
  }

  async function savePhoto(paths: string[]) {
    if (!pickerImage) return;
    await api.addPhoto(job.id, { image_base64: pickerImage, annotation_paths: paths });
    setPickerImage(null);
    setRefreshTick((x) => x + 1);
  }

  async function deletePhoto(pid: string) {
    await api.deletePhoto(job.id, pid);
    setViewPhoto(null);
    setRefreshTick((x) => x + 1);
  }

  async function saveComplaint() {
    if (complaintEdit == null) return;
    await api.patchJob(job.id, { complaint: complaintEdit });
    setComplaintEdit(null);
    setRefreshTick((x) => x + 1);
  }

  async function sendWhatsApp() {
    const msg = invoiceMessage(job, user);
    await openWhatsApp(job.customer_phone, msg);
  }

  async function sharePdf() {
    setInvoiceLoading(true);
    try {
      await generateAndShareInvoice(job, user);
    } catch (e: any) {
      Alert.alert('PDF error', e?.message || 'Could not generate PDF');
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function del() {
    Alert.alert('Delete job card?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await api.deleteJob(job.id); router.back(); },
      },
    ]);
  }

  if (loading || !job) {
    return (
      <SafeAreaView style={s.container} testID="job-detail-loading">
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const checklistItems = [
    { key: 'brakes', label: 'Brakes' },
    { key: 'fluids', label: 'Fluids (Oil, Coolant)' },
    { key: 'tires', label: 'Tires & Air Pressure' },
    { key: 'battery', label: 'Battery' },
    { key: 'lights', label: 'Lights & Indicators' },
    { key: 'belts', label: 'Belts & Hoses' },
    { key: 'chain', label: 'Chain / Drive System' },
    { key: 'wipers', label: 'Wipers & Washers' },
  ];
  const checklistDone = checklistItems.filter((c) => job.checklist?.[c.key]).length;

  function openFullEdit() {
    if (!job) return;
    setEditCustName(job.customer_name || '');
    setEditCustPhone(job.customer_phone || '');
    setEditBrand(job.vehicle_brand || '');
    setEditModel(job.vehicle_model || '');
    setEditRegNo(job.vehicle_reg_no || '');
    setEditOdometer(job.odometer ? String(job.odometer) : '');
    setEditTotalAmount(job.total != null ? String(job.total) : '');
    setFullEditOpen(true);
  }

  async function saveFullEdit() {
    if (!job) return;
    setSavingFullEdit(true);
    try {
      await api.patchJob(job.id, {
        customer_name: editCustName,
        customer_phone: editCustPhone,
        vehicle_brand: editBrand,
        vehicle_model: editModel,
        vehicle_reg_no: editRegNo,
        odometer: editOdometer ? parseInt(editOdometer, 10) : undefined,
        total: editTotalAmount !== '' ? parseFloat(editTotalAmount) : undefined,
      });
      setFullEditOpen(false);
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      Alert.alert('Save Error', e?.message || 'Could not update job card.');
    } finally {
      setSavingFullEdit(false);
    }
  }

  function openItemsEdit() {
    if (!job) return;
    const list = (job.items || []).map((it: any) => ({
      name: it.name || '',
      category: it.category || 'service',
      price: it.price || 0,
      qty: it.qty || 1,
    }));
    setEditItemsList(list.length > 0 ? list : [{ name: '', category: 'service', price: 0, qty: 1 }]);
    setItemsEditOpen(true);
  }

  function updateEditItem(index: number, field: string, value: any) {
    setEditItemsList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addEditItemRow() {
    setEditItemsList((prev) => [...prev, { name: '', category: 'service', price: 0, qty: 1 }]);
  }

  function removeEditItemRow(index: number) {
    setEditItemsList((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveItemsEdit() {
    if (!job) return;
    setSavingItems(true);
    try {
      const cleanItems = editItemsList
        .filter((it) => it.name.trim() !== '')
        .map((it) => ({
          name: it.name.trim(),
          category: it.category || 'service',
          price: Number(it.price) || 0,
          qty: Number(it.qty) || 1,
        }));
      await api.patchJob(job.id, { items: cleanItems });
      setItemsEditOpen(false);
      setRefreshTick((x) => x + 1);
    } catch (e: any) {
      Alert.alert('Save Error', e?.message || 'Could not update items.');
    } finally {
      setSavingItems(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="job-detail-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="jd-back" hitSlop={12}><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={s.headerTitle}>Job Card {job?.job_card_no ? `(${job.job_card_no})` : ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {isMain && (
            <Pressable onPress={openFullEdit} testID="jd-edit-all-fields" hitSlop={12}>
              <Ionicons name="create-outline" size={22} color={colors.brandPrimary} />
            </Pressable>
          )}
          {isMain && (
            <Pressable onPress={del} testID="jd-delete" hitSlop={12}><Ionicons name="trash-outline" size={22} color={colors.error} /></Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 180 }}>
        {/* Vehicle + status */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={job.vehicle_class === 'two_wheeler' ? 'bicycle' : 'car-sport'} size={16} color={colors.brandPrimary} />
                <Text style={s.regNo}>{job.vehicle_reg_no}</Text>
                <View style={s.tag}><Text style={s.tagText}>{job.service_type === 'washing' ? 'WASH' : 'SERVICE'}</Text></View>
              </View>
              <Text style={s.brandModel}>{job.vehicle_brand} {job.vehicle_model}</Text>
              <Text style={s.smallMeta}>
                {[job.vehicle_year, job.fuel, job.odometer ? `${job.odometer} km` : ''].filter(Boolean).join(' • ')}
              </Text>
            </View>
            <StatusBadge status={job.status} />
          </View>
        </View>

        {/* Customer */}
        <View style={s.card}>
          <Text style={s.section}>CUSTOMER</Text>
          <Text style={s.custName}>{job.customer_name}</Text>
          <Text style={s.smallMeta}>{job.customer_phone}</Text>
          <Text style={s.smallMeta}>Created by {job.created_by_name} · {fmtDate(job.created_at)}</Text>
        </View>

        {/* History */}
        {data?.history?.length > 0 && (
          <View style={s.card}>
            <Text style={s.section}>PAST SERVICES</Text>
            {data.history.map((h: any) => (
              <View key={h.id} style={s.historyRow}>
                <Text style={{ color: colors.onSurface, fontSize: 13, flex: 1 }}>{fmtDate(h.created_at)}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }}>{h.service_type}</Text>
                <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 13 }}>{inr(h.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Complaint */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.section}>COMPLAINT / NOTES</Text>
            {canEdit && (
              <Pressable onPress={() => setComplaintEdit(job.complaint || '')} testID="jd-edit-complaint">
                <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: '700' }}>EDIT</Text>
              </Pressable>
            )}
          </View>
          <Text style={{ color: colors.onSurface, marginTop: 8, fontSize: 14 }}>
            {job.complaint || <Text style={{ color: colors.muted }}>No notes added.</Text>}
          </Text>
        </View>

        {/* Items */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.section}>ITEMS · {inr(job.total)}</Text>
            {isMain && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable onPress={openItemsEdit} testID="jd-edit-items">
                  <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: '700' }}>EDIT ITEMS</Text>
                </Pressable>
                <Pressable onPress={openFullEdit} testID="jd-edit-amount">
                  <Text style={{ color: colors.brandPrimary, fontSize: 12, fontWeight: '700' }}>EDIT TOTAL</Text>
                </Pressable>
              </View>
            )}
          </View>
          {(job.items || []).length === 0 && (
            <Text style={{ color: colors.muted, marginTop: 6 }}>No items added.</Text>
          )}
          {(job.items || []).map((it: any, i: number) => (
            <View key={i} style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.onSurface, fontWeight: '600', fontSize: 14 }}>{it.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{inr(it.price)} × {it.qty || 1}</Text>
              </View>
              <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 14 }}>{inr((it.price || 0) * (it.qty || 1))}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={{ color: colors.muted, fontWeight: '700', letterSpacing: 1, fontSize: 12 }}>TOTAL</Text>
            <Text style={{ color: colors.onSurface, fontWeight: '800', fontSize: 20 }}>{inr(job.total)}</Text>
          </View>
        </View>

        {/* Checklist */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.section}>INSPECTION CHECKLIST</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{checklistDone}/{checklistItems.length}</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            {checklistItems.map((c) => {
              const done = !!job.checklist?.[c.key];
              return (
                <Pressable key={c.key} onPress={() => canEdit && toggleChecklist(c.key)} style={s.cbRow} testID={`checklist-${c.key}`}>
                  <View style={[s.cb, done && s.cbOn]}>
                    {done && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={[s.cbLabel, done && s.cbLabelDone]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Timer */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={s.section}>TIME TRACKER</Text>
              <Text style={{ fontSize: 30, fontWeight: '800', color: colors.onSurface, marginTop: 4 }}>
                {fmtTimer(localSeconds)}
              </Text>
            </View>
            {canEdit && (
              <Pressable
                onPress={toggleTimer}
                style={[s.timerBtn, localTimerRunning ? s.timerBtnPause : s.timerBtnPlay]}
                testID="timer-toggle"
              >
                <Ionicons name={localTimerRunning ? 'pause' : 'play'} size={26} color="#fff" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Photos */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.section}>PHOTOS ({(job.photos || []).length})</Text>
            {canEdit && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable onPress={pickFromGallery} style={s.photoBtnSm} testID="jd-photo-gallery" hitSlop={6}>
                  <Ionicons name="images-outline" size={18} color={colors.brandPrimary} />
                </Pressable>
                <Pressable onPress={takePhoto} style={s.photoBtn} testID="jd-photo-camera">
                  <Ionicons name="camera" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Take Photo</Text>
                </Pressable>
              </View>
            )}
          </View>
          {(job.photos || []).length === 0 ? (
            <Text style={{ color: colors.muted, marginTop: 10 }}>Capture parts, damage, or notes.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(job.photos || []).map((p: any) => (
                  <Pressable key={p.id} onPress={() => setViewPhoto(p)} testID={`photo-${p.id}`}>
                    <Image source={{ uri: p.image_base64 }} style={s.photoThumb} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* WhatsApp + PDF (main user only) */}
        {isMain && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <Pressable style={s.waBtn} onPress={sendWhatsApp} testID="jd-whatsapp">
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Send on WhatsApp</Text>
            </Pressable>
            <Pressable style={s.pdfBtn} onPress={sharePdf} disabled={invoiceLoading} testID="jd-pdf">
              {invoiceLoading ? <ActivityIndicator color={colors.brandPrimary} /> : (
                <>
                  <Ionicons name="document-text" size={18} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>Invoice PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Footer status change */}
      <View style={s.footer}>
        <Pressable style={s.primaryBtn} onPress={nextStatus} testID="jd-status-btn">
          <Text style={s.primaryBtnText}>{NEXT[job.status]?.label || 'Update'}</Text>
        </Pressable>
      </View>

      {/* Complaint Edit Modal */}
      <Modal visible={complaintEdit !== null} transparent animationType="slide" onRequestClose={() => setComplaintEdit(null)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setComplaintEdit(null)} />
          <View style={s.sheet}>
            <View style={s.grabber} />
            <Text style={s.sheetTitle}>Edit Notes</Text>
            <TextInput
              value={complaintEdit ?? ''}
              onChangeText={setComplaintEdit}
              multiline
              placeholder="What's the customer reporting?"
              placeholderTextColor={colors.muted}
              style={s.multi}
              testID="jd-complaint-input"
            />
            <Pressable style={s.primaryBtn} onPress={saveComplaint} testID="jd-complaint-save">
              <Text style={s.primaryBtnText}>Save Notes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Full Edit Modal for Owner */}
      <Modal visible={fullEditOpen} transparent animationType="slide" onRequestClose={() => setFullEditOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFullEditOpen(false)} />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.sheet}>
              <View style={s.grabber} />
              <Text style={s.sheetTitle}>Edit All Job Card Details</Text>

              <View style={{ marginBottom: 12 }}>
                <Text style={s.label}>Customer Name</Text>
                <TextInput style={s.input} value={editCustName} onChangeText={setEditCustName} testID="edit-cust-name" />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={s.label}>Mobile Number</Text>
                <TextInput style={s.input} value={editCustPhone} onChangeText={setEditCustPhone} keyboardType="phone-pad" testID="edit-cust-phone" />
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Vehicle Brand</Text>
                  <TextInput style={s.input} value={editBrand} onChangeText={setEditBrand} testID="edit-brand" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Vehicle Model</Text>
                  <TextInput style={s.input} value={editModel} onChangeText={setEditModel} testID="edit-model" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Registration No</Text>
                  <TextInput style={s.input} value={editRegNo} onChangeText={setEditRegNo} autoCapitalize="characters" testID="edit-reg-no" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Odometer (km)</Text>
                  <TextInput style={s.input} value={editOdometer} onChangeText={setEditOdometer} keyboardType="number-pad" testID="edit-odometer" />
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={s.label}>Total Amount (INR)</Text>
                <TextInput style={s.input} value={editTotalAmount} onChangeText={setEditTotalAmount} keyboardType="decimal-pad" placeholder="e.g. 2500" testID="edit-total-amount" />
              </View>

              <Pressable style={[s.primaryBtn, savingFullEdit && { opacity: 0.6 }]} onPress={saveFullEdit} disabled={savingFullEdit} testID="edit-full-save">
                {savingFullEdit ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save All Changes</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Items Modal for Owner */}
      <Modal visible={itemsEditOpen} transparent animationType="slide" onRequestClose={() => setItemsEditOpen(false)}>
        <View style={s.modalWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setItemsEditOpen(false)} />
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={s.sheet}>
              <View style={s.grabber} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={s.sheetTitle}>Edit Items & Prices</Text>
                <Pressable onPress={addEditItemRow} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="add-circle" size={20} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontWeight: '700', fontSize: 13 }}>Add Item</Text>
                </Pressable>
              </View>

              {editItemsList.map((item, idx) => (
                <View key={idx} style={{ backgroundColor: colors.surface, padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <TextInput
                      style={[s.input, { flex: 1, paddingVertical: 8 }]}
                      value={item.name}
                      placeholder="Item / Service Name"
                      onChangeText={(val) => updateEditItem(idx, 'name', val)}
                    />
                    <Pressable onPress={() => removeEditItemRow(idx)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Price (₹)</Text>
                      <TextInput
                        style={[s.input, { paddingVertical: 8 }]}
                        value={String(item.price)}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        onChangeText={(val) => updateEditItem(idx, 'price', val)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.label}>Qty</Text>
                      <TextInput
                        style={[s.input, { paddingVertical: 8 }]}
                        value={String(item.qty)}
                        keyboardType="number-pad"
                        placeholder="1"
                        onChangeText={(val) => updateEditItem(idx, 'qty', val)}
                      />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.onSurface, textAlign: 'right' }}>
                        = ₹{((Number(item.price) || 0) * (Number(item.qty) || 1)).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
                <Text style={{ fontWeight: '700', color: colors.muted, fontSize: 13 }}>CALCULATED TOTAL</Text>
                <Text style={{ fontWeight: '800', color: colors.onSurface, fontSize: 18 }}>
                  ₹{editItemsList.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0).toFixed(0)}
                </Text>
              </View>

              <Pressable style={[s.primaryBtn, savingItems && { opacity: 0.6 }]} onPress={saveItemsEdit} disabled={savingItems} testID="edit-items-save">
                {savingItems ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save Items</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Photo Viewer */}
      <Modal visible={!!viewPhoto} transparent animationType="fade" onRequestClose={() => setViewPhoto(null)}>
        <View style={s.viewerWrap}>
          <View style={s.viewerHeader}>
            <Pressable onPress={() => setViewPhoto(null)} hitSlop={12} testID="viewer-close">
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            {canEdit && viewPhoto && (
              <Pressable onPress={() => deletePhoto(viewPhoto.id)} testID="viewer-delete" hitSlop={12}>
                <Ionicons name="trash" size={22} color="#fff" />
              </Pressable>
            )}
          </View>
          {viewPhoto && (
            <View style={s.viewerImage}>
              <Image source={{ uri: viewPhoto.image_base64 }} style={StyleSheet.absoluteFill} resizeMode="contain" />
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width="100%" height="100%">
                  {(viewPhoto.annotation_paths || []).map((raw: any, i: number) => {
                    try {
                      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                      return <Path key={i} d={parsed.d} stroke={parsed.c || '#DC2626'} strokeWidth={4} fill="none" strokeLinecap="round" />;
                    } catch {
                      return null;
                    }
                  })}
                </Svg>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Annotator */}
      {pickerImage && (
        <PhotoAnnotator
          visible={!!pickerImage}
          imageBase64={pickerImage}
          onClose={() => setPickerImage(null)}
          onSave={(paths) => savePhoto(paths)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card },
  section: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.2 },
  regNo: { fontSize: 15, fontWeight: '800', color: colors.onSurface, letterSpacing: 0.5 },
  tag: { backgroundColor: colors.brandTertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  tagText: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  brandModel: { color: colors.onSurface, fontSize: 18, fontWeight: '800', marginTop: 6 },
  smallMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  custName: { color: colors.onSurface, fontSize: 17, fontWeight: '700', marginTop: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  cbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  cb: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cbOn: { backgroundColor: colors.success, borderColor: colors.success },
  cbLabel: { color: colors.onSurface, fontSize: 15, fontWeight: '500' },
  cbLabelDone: { color: colors.muted, textDecorationLine: 'line-through' },
  timerBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  timerBtnPlay: { backgroundColor: colors.success },
  timerBtnPause: { backgroundColor: colors.warning },
  photoBtnSm: { padding: 10, borderRadius: radius.md, backgroundColor: colors.brandTertiary },
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md,
  },
  photoThumb: { width: 84, height: 84, borderRadius: 10 },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.whatsapp, padding: 14, borderRadius: radius.md,
  },
  pdfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brandTertiary, padding: 14, borderRadius: radius.md,
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: colors.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  multi: {
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
    height: 120, textAlignVertical: 'top', marginBottom: spacing.md,
  },
  viewerWrap: { flex: 1, backgroundColor: '#000' },
  viewerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg,
    paddingTop: 60, paddingBottom: 10,
  },
  viewerImage: { flex: 1 },
});
