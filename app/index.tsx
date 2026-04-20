import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { getOnboardingComplete } from '@/lib/onboardingStorage';

export default function Index() {
  const { colors } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    getOnboardingComplete().then((done) => {
      setOnboarded(done);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!onboarded) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
