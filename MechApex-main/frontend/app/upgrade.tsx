import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, font } from '@/src/theme';
import { api, getUser, saveUser } from '@/src/api';
import { inr } from '@/src/utils/format';

const PACKAGES = [
  {
    id: '500',
    title: 'Starter Pack',
    cards: 500,
    price: 1249,
    perCard: '₹2.50 / card',
    recommended: false,
    color: colors.brandPrimary,
    features: [
      '500 Additional Job Cards',
      'Unlimited Workers & Mechanics',
      'WhatsApp Receipt Sharing',
      'CSV & Excel Data Exports',
      'Valid for 1 Year',
    ],
  },
  {
    id: '1000',
    title: 'Pro Pack',
    cards: 1000,
    price: 2249,
    perCard: '₹2.25 / card (Best Value)',
    recommended: true,
    color: '#8B5CF6',
    features: [
      '1,000 Additional Job Cards',
      'Unlimited Workers & Mechanics',
      'WhatsApp Receipt Sharing',
      'CSV & Excel Data Exports',
      'Priority Customer Support',
      'Valid for 1 Year',
    ],
  },
  {
    id: '5000',
    title: 'Enterprise Pack',
    cards: 5000,
    price: 9999,
    perCard: '₹2.00 / card (Maximum Savings)',
    recommended: false,
    color: '#EC4899',
    features: [
      '5,000 Additional Job Cards',
      'Unlimited Workers & Mechanics',
      'WhatsApp & SMS Integration',
      'CSV & Excel Data Exports',
      'Dedicated Account Manager',
      'Valid for 2 Years',
    ],
  },
];

export default function Upgrade() {
  const [user, setUser] = useState<any>(null);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [purchasedLimit, setPurchasedLimit] = useState(0);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleBuy(pkg: any) {
    setSelectedPkg(pkg);
    setBuying(true);
    try {
      const res = await api.upgradePackage(pkg.id);
      setPurchasedLimit(res.job_card_limit || (user?.job_card_limit || 100) + pkg.cards);
      const freshUser = await api.me();
      await saveUser(freshUser);
      setUser(freshUser);
      setSuccessOpen(true);
    } catch (e: any) {
      Alert.alert('Upgrade Error', e?.message || 'Could not complete package upgrade.');
    } finally {
      setBuying(false);
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="upgrade-screen">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="upgrade-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={s.headerTitle}>Upgrade Job Card Package</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
        {/* Banner */}
        <View style={s.topBanner}>
          <View style={s.bannerIcon}>
            <Ionicons name="sparkles" size={24} color="#FFD700" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Unlock Unlimited Garage Growth</Text>
            <Text style={s.bannerSub}>
              Current Limit: <Text style={{ fontWeight: '800', color: colors.brandPrimary }}>{user?.job_card_limit || 100} Job Cards</Text>
            </Text>
          </View>
        </View>

        <Text style={s.sectionHeader}>SELECT YOUR PACKAGE</Text>

        {PACKAGES.map((pkg) => (
          <View
            key={pkg.id}
            style={[s.pkgCard, pkg.recommended && s.recommendedCard]}
            testID={`pkg-card-${pkg.id}`}
          >
            {pkg.recommended && (
              <View style={s.recBadge}>
                <Text style={s.recBadgeText}>RECOMMENDED</Text>
              </View>
            )}

            <View style={s.pkgHeader}>
              <View>
                <Text style={s.pkgTitle}>{pkg.title}</Text>
                <Text style={s.pkgCardsCount}>{pkg.cards.toLocaleString()} Job Cards</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.pkgPrice}>{inr(pkg.price)}</Text>

              </View>
            </View>

            <View style={s.divider} />

            <View style={s.featureList}>
              {pkg.features.map((f, idx) => (
                <View key={idx} style={s.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={pkg.color} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[s.buyBtn, { backgroundColor: pkg.color }, buying && { opacity: 0.6 }]}
              onPress={() => handleBuy(pkg)}
              disabled={buying}
              testID={`buy-pkg-${pkg.id}`}
            >
              {buying && selectedPkg?.id === pkg.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buyBtnText}>Upgrade for {inr(pkg.price)}</Text>
              )}
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successOpen} transparent animationType="fade" onRequestClose={() => setSuccessOpen(false)}>
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <View style={s.successIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={s.modalTitle}>Package Upgraded Successfully!</Text>
            <Text style={s.modalDesc}>
              Your garage limit has been increased to{' '}
              <Text style={{ fontWeight: '800', color: colors.brandPrimary }}>
                {purchasedLimit.toLocaleString()} Job Cards
              </Text>.
            </Text>

            <Pressable
              style={s.modalBtn}
              onPress={() => {
                setSuccessOpen(false);
                router.back();
              }}
              testID="upgrade-success-close"
            >
              <Text style={s.modalBtnText}>Back to App</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, paddingBottom: spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  topBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.brandTertiary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card,
  },
  bannerIcon: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: colors.onBrandTertiary },
  bannerSub: { fontSize: 13, color: colors.onBrandTertiary, marginTop: 2 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  pkgCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  recommendedCard: {
    borderColor: '#8B5CF6', borderWidth: 2,
  },
  recBadge: {
    position: 'absolute', top: -12, right: 20, backgroundColor: '#8B5CF6',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
  },
  recBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pkgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pkgTitle: { fontSize: 18, fontWeight: '800', color: colors.onSurface },
  pkgCardsCount: { fontSize: 13, color: colors.muted, marginTop: 2, fontWeight: '600' },
  pkgPrice: { fontSize: 22, fontWeight: '800', color: colors.onSurface },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  featureList: { gap: 8, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: '600' },
  buyBtn: {
    paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  buyBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', width: '100%' },
  successIconWrap: { marginBottom: spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.onSurface, textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing.lg },
  modalBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 28 },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
