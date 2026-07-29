import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font, shadow } from '@/src/theme';
import { api, setSession } from '@/src/api';
import { useLang } from '@/src/i18n';

export default function Login() {
  const { t } = useLang();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendOtp() {
    setErr(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return setErr('Enter a valid 10-digit mobile number');
    setLoading(true);
    try {
      const r: any = await api.sendOtp(digits);
      setDemoOtp(r.demo_otp || null);
      setWarning(r.warning || null);
      setStep('otp');
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function verify() {
    setErr(null);
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const r: any = await api.verifyOtp(digits, otp, name);
      await setSession(r.token, r.user);
      router.replace(r.user?.role === 'sub' ? '/(tabs)/home' : '/(tabs)/home');
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View style={s.hero}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/9545547/pexels-photo-9545547.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient colors={['rgba(17,24,39,0)', 'rgba(17,24,39,0.4)', colors.surface]} style={StyleSheet.absoluteFill} />
          <View style={s.heroContent}>
            <Text style={s.brand}>MechApex</Text>
            <Text style={s.tag}>{t('welcome')}</Text>
          </View>
        </View>

        <View style={s.card}>
          {step === 'phone' ? (
            <>
              <Text style={s.title}>{t('enter_mobile')}</Text>
              <Text style={s.sub}>We&apos;ll send a 6-digit OTP to verify</Text>

              <Text style={s.label}>Mobile Number</Text>
              <View style={s.phoneRow}>
                <View style={s.cc}><Text style={{ color: colors.onSurface, fontWeight: '700' }}>+91</Text></View>
                <TextInput
                  testID="login-phone-input"
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={s.phoneInput}
                />
              </View>

              <Text style={[s.label, { marginTop: 12 }]}>Your Name (first login only)</Text>
              <TextInput
                testID="login-name-input"
                value={name}
                onChangeText={setName}
                placeholder="Optional if you already have an account"
                placeholderTextColor={colors.muted}
                style={s.input}
              />

              {err && <Text style={s.err} testID="login-error">{err}</Text>}

              <Pressable
                testID="send-otp-button"
                onPress={sendOtp}
                disabled={loading}
                style={({ pressed }) => [s.primaryBtn, pressed && { opacity: 0.85 }]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('send_otp')}</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => setStep('phone')} style={s.back} testID="otp-back-button">
                <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
                <Text style={{ color: colors.onSurface, fontWeight: '600' }}>Back</Text>
              </Pressable>
              <Text style={s.title}>{t('verify_otp')}</Text>
              <Text style={s.sub}>{t('otp_hint')} sent to +91 {phone}</Text>

              {demoOtp && (
                <View style={s.otpHint} testID="demo-otp-hint">
                  <Ionicons name="information-circle" size={16} color={colors.info} />
                  <Text style={s.otpHintText}>
                    {warning ? 'SMS unavailable — ' : 'Demo OTP: '}
                    <Text style={{ fontWeight: '800' }}>{demoOtp}</Text>
                  </Text>
                </View>
              )}

              <TextInput
                testID="otp-input"
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor={colors.muted}
                style={[s.input, { letterSpacing: 8, fontSize: 22, textAlign: 'center', marginTop: 8 }]}
              />
              {err && <Text style={s.err} testID="otp-error">{err}</Text>}

              <Pressable
                testID="verify-otp-button"
                onPress={verify}
                disabled={loading || otp.length !== 6}
                style={({ pressed }) => [s.primaryBtn, (loading || otp.length !== 6) && { opacity: 0.6 }, pressed && { opacity: 0.85 }]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>{t('verify_otp')}</Text>}
              </Pressable>

              <Pressable onPress={sendOtp} style={s.resend} testID="resend-otp">
                <Text style={{ color: colors.brandPrimary, fontWeight: '600' }}>Resend OTP</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: { height: 260, width: '100%', justifyContent: 'flex-end' },
  heroContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tag: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.surfaceSecondary, marginHorizontal: spacing.lg, marginTop: -20,
    borderRadius: radius.lg, padding: spacing.xl, ...shadow.card,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.onSurface },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', color: colors.onSurfaceSecondary, marginBottom: 6, letterSpacing: 0.5 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  cc: {
    width: 64, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  phoneInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: font.lg, color: colors.onSurface,
    borderWidth: 1, borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: 12, fontSize: font.lg, color: colors.onSurface, borderWidth: 1, borderColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingVertical: 14,
    alignItems: 'center', marginTop: spacing.lg,
  },
  primaryBtnText: { color: colors.onBrandPrimary, fontSize: font.lg, fontWeight: '700' },
  err: { color: colors.error, marginTop: 6, fontSize: 13 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  otpHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9',
    padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md,
  },
  otpHintText: { color: colors.onSurface, fontSize: 13, flex: 1 },
  resend: { alignItems: 'center', padding: 12, marginTop: 4 },
});
