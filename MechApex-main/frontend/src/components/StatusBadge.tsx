import { View, Text } from 'react-native';
import { colors, radius, statusMeta } from '@/src/theme';

export function StatusBadge({ status, testID }: { status: string; testID?: string }) {
  const m = statusMeta[status] || { label: status, bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary };
  return (
    <View
      testID={testID}
      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: m.bg }}
    >
      <Text style={{ color: m.fg, fontWeight: '700', fontSize: 11 }}>{m.label}</Text>
    </View>
  );
}
