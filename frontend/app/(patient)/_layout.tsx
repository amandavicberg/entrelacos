import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack, Tabs, type RelativePathString } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, useTheme } from 'tamagui';

import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

const tabs = [
  { name: 'index', title: 'Início', icon: 'home-outline', selected: 'home' },
  { name: 'minha-agenda', title: 'Agenda', icon: 'calendar-outline', selected: 'calendar' },
  { name: 'materials', title: 'Materiais', icon: 'folder-open-outline', selected: 'folder-open' },
  { name: 'space', title: 'Meu espaço', icon: 'person-circle-outline', selected: 'person-circle' },
] as const;

function PatientTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs initialRouteName="index" backBehavior="initialRoute" screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: theme.background.val },
      tabBarActiveTintColor: theme.brand.val,
      tabBarInactiveTintColor: theme.muted.val,
      tabBarActiveBackgroundColor: theme.soft.val,
      tabBarLabelPosition: 'below-icon',
      tabBarLabelStyle: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, lineHeight: 18 },
      tabBarItemStyle: { borderRadius: 16, marginHorizontal: 2, paddingVertical: 4 },
      tabBarStyle: { backgroundColor: theme.surface.val, borderTopColor: theme.borderColor.val,
        height: 80 + Math.max(0, fontScale - 1) * 28 + Math.max(insets.bottom, 8),
        paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), paddingHorizontal: 8 },
    }}>
      {tabs.map(({ name, title, icon, selected }) => (
        <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title,
          tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? selected : icon} color={color} size={22} accessible={false} />,
        }} />
      ))}
      {['observations', 'history', 'documents', 'messages', 'check-ins', 'connect', 'pending'].map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}

export default function PatientLayout() {
  const { accessState } = useAuth();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState === 'professional') return <Redirect href="/(professional)" />;
  if (accessState === 'signed-out') return <Redirect href={'/login' as RelativePathString} />;
  if (accessState !== 'patient-active' && accessState !== 'patient-pending' && accessState !== 'patient-unassociated') {
    return <Redirect href="/login" />;
  }
  if (accessState !== 'patient-active') return (
    <Theme name="light_patient"><Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={accessState === 'patient-unassociated'}><Stack.Screen name="connect" /></Stack.Protected>
      <Stack.Protected guard={accessState === 'patient-pending'}><Stack.Screen name="pending" /></Stack.Protected>
    </Stack></Theme>
  );
  return <Theme name="light_patient"><PatientTabs /></Theme>;
}
