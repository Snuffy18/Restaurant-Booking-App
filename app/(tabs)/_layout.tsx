import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

const AI_SPARKLES = require('../../assets/images/ai-sparkles.png');

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

function AiTabBarIcon({ color }: { color: string }) {
  return (
    <Image
      source={AI_SPARKLES}
      style={[styles.aiTabIcon, { tintColor: color }]}
      contentFit="contain"
      accessibilityLabel="AI chat"
    />
  );
}

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: useClientOnlyValue(false, false),
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI chat',
          tabBarIcon: ({ color }) => <AiTabBarIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  aiTabIcon: {
    width: 24,
    height: 24,
    marginBottom: -2,
  },
});
