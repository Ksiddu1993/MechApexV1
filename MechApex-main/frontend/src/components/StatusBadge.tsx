import { View, Text } from 'react-native';
import { colors, radius, statusMeta } from '@/src/theme';

export function StatusBadge({ status, testID }: { status: string; testID?: string }) {
  const m = statusMeta[status] || { label: status, bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary, dot: colors.muted };
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.pill,
        backgroundColor: m.bg,
        alignSelf: 'flex-start',
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.dot }} />
      <Text style={{ color: m.fg, fontWeight: '700', fontSize: 11, letterSpacing: 0.2 }}>{m.label}</Text>
    </View>
  );
}

