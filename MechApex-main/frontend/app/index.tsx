import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { isAuthed } from '@/src/api';
import { colors } from '@/src/theme';

export default function Index() {
  useEffect(() => {
    (async () => {
      const ok = await isAuthed();
      setTimeout(() => {
        if (ok) router.replace('/(tabs)/home');
        else router.replace('/(auth)/login');
      }, 40);
    })();
  }, []);
  return (
    <View style={s.c} testID="splash-screen">
      <ActivityIndicator color={colors.brandPrimary} />
    </View>
  );
}

const s = StyleSheet.create({ c: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' } });
