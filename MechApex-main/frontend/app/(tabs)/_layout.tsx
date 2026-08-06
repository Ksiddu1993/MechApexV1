import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { colors } from '@/src/theme';
import { getUser } from '@/src/api';
import { useLang } from '@/src/i18n';

export default function TabsLayout() {
  const { t } = useLang();
  const [role, setRole] = useState<string>('main');

  useEffect(() => { getUser().then(u => u && setRole(u.role || 'main')); }, []);

  const isOwner = role === 'main';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('home'), tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} />
        )}}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Job Cards', tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={22} />
        )}}
      />

      {/* Customers — hidden for workers */}
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          href: isOwner ? '/customers' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={22} />
          ),
        }}
      />


      {/* Service Catalog — owner only, accessed via More tab */}
      <Tabs.Screen
        name="services"
        options={{
          href: null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'construct' : 'construct-outline'} color={color} size={22} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: t('analytics'),
          href: isOwner ? '/analytics' : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t('more'), tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline'} color={color} size={22} />
        )}}
      />
    </Tabs>
  );
}
