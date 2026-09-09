import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, type RelativePathString } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, useTheme } from 'tamagui';

import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ProfessionalIcon } from '@/components/professional/professional-screen';

const tabs: { name: string; title: string; icon: ProfessionalIcon; selected: ProfessionalIcon }[] = [
  { name: 'index', title: 'Início', icon: 'home-outline', selected: 'home' },
  { name: 'patients', title: 'Pacientes', icon: 'people-outline', selected: 'people' },
  { name: 'agenda', title: 'Agenda', icon: 'calendar-outline', selected: 'calendar' },
  { name: 'materials', title: 'Materiais', icon: 'folder-outline', selected: 'folder' },
];

function ProfessionalTabs() {
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
    </Tabs>
  );
}

export default function ProfessionalLayout() {
  const { accessState } = useAuth();
  const scheme = useColorScheme();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState === 'signed-out') return <Redirect href={'/login' as RelativePathString} />;
  if (accessState === 'patient-active') return <Redirect href="/(patient)" />;
  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState !== 'professional') return <Redirect href="/login" />;
  return <Theme name={scheme === 'dark' ? 'dark_professional' : 'light_professional'}><ProfessionalTabs /></Theme>;
}
