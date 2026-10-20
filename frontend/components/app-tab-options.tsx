import type { BottomTabNavigationOptions } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTokens, useTheme, YStack } from 'tamagui';
import { BrandLogo } from '@/components/brand-logo';
import { useScreenLayout } from '@/hooks/use-screen-layout';

/** The same routes become a quiet sidebar on desktop and a thumb-friendly dock on mobile. */
export function useAppTabOptions(): BottomTabNavigationOptions {
  const theme = useTheme();
  const tokens = getTokens();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useScreenLayout();
  const sidebar = width >= 1200 && fontScale < 1.5;
  return {
    headerShown: false,
    sceneStyle: { backgroundColor: theme.background.val },
    tabBarPosition: sidebar ? 'left' : 'bottom',
    tabBarLabelPosition: sidebar ? 'beside-icon' : 'below-icon',
    tabBarActiveTintColor: sidebar ? theme.brandContrast.val : theme.brand.val,
    tabBarInactiveTintColor: sidebar ? theme.muted.val : theme.heroMuted.val,
    tabBarActiveBackgroundColor: sidebar ? theme.brand.val : theme.heroText.val,
    tabBarAllowFontScaling: true,
    tabBarHideOnKeyboard: true,
    tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: sidebar ? 13 : 11, lineHeight: 18, flexShrink: 0 },
    tabBarItemStyle: {
      borderRadius: tokens.radius.control.val, marginHorizontal: 2,
      marginVertical: sidebar ? 4 : 0, minHeight: 56, paddingVertical: 0, overflow: 'hidden',
    },
    tabBarStyle: sidebar ? {
      width: 208, margin: 16, paddingTop: 132, paddingHorizontal: 12,
      backgroundColor: theme.surface.val, borderRadius: tokens.radius.panel.val,
      borderRightWidth: 0, elevation: 0,
    } : {
      backgroundColor: theme.brandPress.val, borderTopWidth: 0,
      borderRadius: tokens.radius.panel.val, marginHorizontal: 12,
      marginBottom: Math.max(insets.bottom, 10),
      height: 80 + Math.max(0, fontScale - 1) * 34,
      paddingTop: 8, paddingBottom: 8, paddingHorizontal: 6, elevation: 0,
    },
    tabBarBackground: sidebar ? () => <YStack position="absolute" style={{ top: 24, left: 20 }} pointerEvents="none">
      <BrandLogo width={164} framed={false} />
    </YStack> : undefined,
  };
}
