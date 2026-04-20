import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppColors } from '@/constants/Theme';
import { Radius, Spacing } from '@/constants/Theme';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { RESTAURANTS } from '@/data/mockData';

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    headerBtn: { padding: 8 },
    title: { color: c.text, fontSize: 20, fontWeight: '800' },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
    row: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    rowImg: { width: 96, height: 96 },
    rowBody: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
    rowName: { fontWeight: '800', fontSize: 16, color: c.text },
    rowMeta: { marginTop: 4, color: c.textSecondary, fontSize: 13 },
  });
}

export default function AllRestaurantsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <FontAwesome name="chevron-left" size={18} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>See all restaurants</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {RESTAURANTS.map((restaurant) => (
          <Pressable
            key={restaurant.id}
            style={styles.row}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })}>
            <Image source={{ uri: restaurant.image }} style={styles.rowImg} contentFit="cover" />
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {restaurant.cuisine.join(' • ')}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
