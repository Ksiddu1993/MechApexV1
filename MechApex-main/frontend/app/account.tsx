import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors, spacing, radius, shadow, font, THEME_PRESETS, applyTheme } from '@/src/theme';
import { api, getUser, saveUser } from '@/src/api';

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await api.me();
        setUser(u);
        await saveUser(u);
      } catch {
        const u = await getUser();
        setUser(u);
      }
    })();
  }, []);

  function set(k: string, v: any) { setUser((u: any) => ({ ...u, [k]: v })); }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Please grant photo library access.');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      const dataUri = `data:image/jpeg;base64,${a.base64}`;
      set('photo_base64', dataUri);
    }
  }

  async function useCurrentLocation() {
    setLocating(true); setErr(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setErr('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      set('lat', loc.coords.latitude);
      set('lng', loc.coords.longitude);
      try {
        const rev = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (rev[0]) {
          const r = rev[0];
          const parts = [r.name, r.street, r.city, r.region, r.postalCode, r.country].filter(Boolean);
          set('address', parts.join(', '));
        }
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'Could not fetch location');
    } finally {
      setLocating(false);
    }
  }

  async function save() {
    setErr(null);
    if (user?.role === 'main') {
      if (!user.garage_name) return setErr('Garage name is required');
      if (!user.telephone) return setErr('Telephone number is required');
      if (!user.photo_base64) return setErr('Photo is required');
    }
    setSaving(true);
    try {
      const fresh = await api.updateProfile({
        name: user.name || '',
        garage_name: user.garage_name || '',
        gstin: user.gstin || '',
        telephone: user.telephone || '',
        email: user.email || '',
        photo_base64: user.photo_base64 || '',
        address: user.address || '',
        lat: user.lat ?? null,
        lng: user.lng ?? null,
      });
      await saveUser(fresh);
      router.back();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (!user) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const isMain = user.role === 'main';

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="account-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} testID="account-back"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
          <Text style={s.headerTitle}>My Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <View style={s.photoWrap}>
            <Pressable onPress={pickPhoto} testID="account-photo-picker">
              {user.photo_base64 ? (
                <Image source={{ uri: user.photo_base64 }} style={s.photo} />
              ) : (
                <View style={s.photoPh}>
                  <Ionicons name="camera" size={28} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                    {isMain ? 'Add photo *' : 'Add photo'}
                  </Text>
                </View>
              )}
              <View style={s.photoEdit}><Ionicons name="pencil" size={14} color="#fff" /></View>
            </Pressable>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{isMain ? 'Owner' : 'Worker'} • {user.phone}</Text>
          </View>

          <SectionTitle title="My Details" />
          <Field label={isMain ? 'Owner Name' : 'Worker Name'} value={user.name} onChange={(v: string) => set('name', v)} testID="acc-name" />
          {isMain && <Field label="Garage Name *" value={user.garage_name} onChange={(v: string) => set('garage_name', v)} testID="acc-garage" />}
          {isMain && <Field label="GSTIN" value={user.gstin} onChange={(v: string) => set('gstin', v)} placeholder="Optional" testID="acc-gstin" autoCapitalize="characters" />}
          <Field label={isMain ? 'Telephone *' : 'Telephone'} value={user.telephone} onChange={(v: string) => set('telephone', v)} keyboardType="phone-pad" testID="acc-tel" />
          <Field label="Email" value={user.email} onChange={(v: string) => set('email', v)} keyboardType="email-address" testID="acc-email" />

          <SectionTitle title="Address" />
          <View style={s.addressWrap}>
            <TextInput
              testID="acc-address"
              value={user.address}
              onChangeText={(v) => set('address', v)}
              placeholder="Shop No, Street, City, Pin"
              placeholderTextColor={colors.muted}
              multiline
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            />
            <Pressable
              onPress={useCurrentLocation}
              style={s.locBtn}
              disabled={locating}
              testID="acc-use-location"
            >
              {locating ? (
                <ActivityIndicator color={colors.brandPrimary} />
              ) : (
                <>
                  <Ionicons name="location" size={16} color={colors.brandPrimary} />
                  <Text style={{ color: colors.brandPrimary, fontWeight: '700', fontSize: 13 }}>Use current location</Text>
                </>
              )}
            </Pressable>
            {user.lat && user.lng ? (
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                📍 {user.lat.toFixed(4)}, {user.lng.toFixed(4)}
              </Text>
            ) : null}
          </View>

          <SectionTitle title="App Color & Theme" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg }}>
            {Object.entries(THEME_PRESETS).map(([key, t]) => (
              <Pressable
                key={key}
                style={[
                  s.themeChip,
                  { borderColor: t.primary },
                  colors.brandPrimary === t.primary && s.themeChipActive,
                ]}
                onPress={async () => {
                  await applyTheme(key);
                  set('theme_tick', Date.now());
                }}
              >
                <View style={[s.themeDot, { backgroundColor: t.primary }]} />
                <Text style={[s.themeText, colors.brandPrimary === t.primary && s.themeTextActive]}>{t.name}</Text>
              </Pressable>
            ))}
          </View>

          {err && <Text style={s.err} testID="acc-error">{err}</Text>}
        </ScrollView>

        <View style={s.footer}>
          <Pressable
            style={[s.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
            testID="account-save"
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Save changes</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: any) {
  return <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>;
}

function Field({ label, value, onChange, placeholder, keyboardType, testID, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        testID={testID}
        value={value || ''}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || (keyboardType === 'email-address' ? 'none' : 'sentences')}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  photoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  photo: { width: 110, height: 110, borderRadius: 55 },
  photoPh: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.brandPrimary, borderStyle: 'dashed',
  },
  photoEdit: {
    position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brandPrimary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, fontSize: 15, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  addressWrap: {},
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandTertiary,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md, marginTop: 8, alignSelf: 'flex-start',
  },
  err: { color: colors.error, marginTop: 8, fontSize: 13 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border,
  },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '700' },
  themeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 2, backgroundColor: colors.surfaceSecondary, width: '48%',
  },
  themeChipActive: { backgroundColor: colors.brandTertiary },
  themeDot: { width: 16, height: 16, borderRadius: 8 },
  themeText: { fontSize: 13, fontWeight: '700', color: colors.onSurface },
  themeTextActive: { color: colors.brandPrimary },
});
