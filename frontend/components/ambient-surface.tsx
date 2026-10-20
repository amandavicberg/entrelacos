import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

type AmbientSurfaceProps = ComponentProps<typeof YStack> & { strong?: boolean };

/** Local, decorative photography. A semantic scrim keeps content readable. */
export function AmbientSurface({ children, strong = false, gap, ...props }: AmbientSurfaceProps) {
  return <YStack position="relative" overflow="hidden" bg="$hero" {...props}>
    <Image source={require('../assets/images/care-texture.jpg')} contentFit="cover"
      style={StyleSheet.absoluteFill} accessible={false} accessibilityElementsHidden />
    <YStack position="absolute" inset={0} bg={strong ? '$photoShadeStrong' : '$photoShade'} pointerEvents="none" aria-hidden />
    <YStack position="relative" style={{ zIndex: 1 }} gap={gap} flex={props.flex ? 1 : undefined} minW={0}>
      {children}
    </YStack>
  </YStack>;
}
