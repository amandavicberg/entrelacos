import { Image } from 'react-native';
import { XStack } from 'tamagui';

type BrandLogoProps = {
  compact?: boolean;
  width?: number;
};

/** Preserva a marca e sua legibilidade em superfícies claras e escuras. */
export function BrandLogo({ compact = false, width }: BrandLogoProps) {
  const imageWidth = width ?? (compact ? 44 : 220);
  const imageHeight = compact ? imageWidth : Math.round(imageWidth / 2.4);
  const source = compact
    ? require('../assets/brand/entrelacos-app-icon.png')
    : require('../assets/brand/entrelacos-logo-horizontal-transparent.png');

  return (
    <XStack
      self="flex-start"
      shrink={0}
      bg={compact ? 'transparent' : '$logoSurface'}
      px={compact ? 0 : '$3'}
      py={compact ? 0 : '$2'}
      rounded="$control"
      borderWidth={compact ? 0 : 1}
      borderColor="$logoBorder"
    >
      <Image
        source={source}
        accessibilityLabel="EntreLaços"
        accessible
        resizeMode="contain"
        style={{ width: imageWidth, height: imageHeight }}
      />
    </XStack>
  );
}
