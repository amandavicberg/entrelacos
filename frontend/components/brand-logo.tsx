import { Image } from 'react-native';
import { XStack } from 'tamagui';

type BrandLogoProps = {
  compact?: boolean;
  width?: number;
};

/** Renderiza exclusivamente os arquivos oficiais da marca, sem recoloração. */
export function BrandLogo({ compact = false, width }: BrandLogoProps) {
  const imageWidth = width ?? (compact ? 44 : 220);
  const imageHeight = compact ? imageWidth : Math.round(imageWidth / 2.4);
  const source = compact
    ? require('../assets/brand/entrelacos-app-icon.png')
    : require('../assets/brand/entrelacos-logo-horizontal.png');

  return (
    <XStack width={imageWidth} height={imageHeight} shrink={0}>
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
