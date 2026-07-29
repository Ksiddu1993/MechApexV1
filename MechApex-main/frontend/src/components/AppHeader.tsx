import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '@/src/theme';

type Props = {
  name?: string;
  photo?: string;
  garage_name?: string;
  showBack?: boolean;
  title?: string;
  rightAction?: React.ReactNode;
};

export function AppHeader({ name, photo, garage_name, showBack, title, rightAction }: Props) {
  return (
    <View style={s.wrap}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {showBack && (
          <Pressable onPress={() => router.back()} testID="header-back" hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {title ? (
            <Text style={s.title} numberOfLines={1}>{title}</Text>
          ) : (
            <>
              <Text style={s.h1}>{garage_name || 'MechApex'}</Text>
              <Text style={s.h2} numberOfLines={1}>Hi, {name || 'there'}</Text>
            </>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {rightAction}
        <Pressable
          onPress={() => router.push('/reminders')}
          style={s.bellBtn}
          testID="header-reminders-button"
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/account')}
          style={s.avatarBtn}
          testID="header-account-button"
          hitSlop={8}
        >
          {photo ? (
            <Image source={{ uri: photo }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={{ color: colors.onBrandTertiary, fontWeight: '800' }}>
                {(name || 'U').slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    gap: 12,
  },
  h1: { color: colors.onSurface, fontSize: 20, fontWeight: '800' },
  h2: { color: colors.muted, fontSize: 12, marginTop: 2 },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: '700' },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  avatarBtn: { ...shadow.card },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
});
