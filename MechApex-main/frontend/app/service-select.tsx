import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';
import { useLang } from '@/src/i18n';

export default function ServiceSelect() {
  const { vc } = useLocalSearchParams<{ vc: 'two_wheeler' | 'four_wheeler' }>();
  const { t } = useLang();
  const isTwo = vc === 'two_wheeler';

  return (
    <SafeAreaView style={s.container} edges={['top']} testID="service-select">
      <View style={s.header}>
        <Pressable onPress={() => router.back()} testID="svc-back" hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={s.title}>{isTwo ? t('two_wheeler') : t('four_wheeler')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: spacing.lg, gap: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>Choose the service you want to create a job for.</Text>

        <ServiceCard
          title={t('service')}
          desc="General service, engine service, spare parts"
          icon="build"
          image="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&auto=format&fit=crop"
          onPress={() => router.push(`/job-create?vc=${vc}&st=service`)}
          testID="svc-service"
        />
        <ServiceCard
          title={t('washing')}
          desc="Exterior wash, interior detailing, polish"
          icon="water"
          image="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=900&auto=format&fit=crop"
          onPress={() => router.push(`/job-create?vc=${vc}&st=washing`)}
          testID="svc-wash"
        />
      </View>
    </SafeAreaView>
  );
}

function ServiceCard({ title, desc, icon, image, onPress, testID }: any) {
  return (
    <Pressable style={s.card} onPress={onPress} testID={testID}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(17,24,39,0.15)', 'rgba(17,24,39,0.85)']} style={StyleSheet.absoluteFill} />
      <View style={s.cardInner}>
        <View style={s.icon}><Ionicons name={icon} size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardDesc}>{desc}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#fff" />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: '800', color: colors.onSurface },
  card: { height: 140, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  cardInner: { flex: 1, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
});
