import type { ComponentProps } from 'react';
import { AppButton as Button } from '@/components/app-button';

type BrandButtonProps = ComponentProps<typeof Button>;

export function BrandButton(props: BrandButtonProps) {
  return (
    <Button
      bg="$brand"
      color="$brandContrast"
      textProps={{ color: '$brandContrast', shrink: 1, text: 'center' }}
      fontFamily="$heading"
      minH="$control"
      height="auto"
      py="$3"
      px="$5"
      maxW="100%"
      borderWidth={1}
      borderColor="$brand"
      disabledStyle={{ opacity: 0.55 }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$outlineColor', outlineStyle: 'solid' }}
      rounded="$pill"
      pressStyle={{ bg: '$brandPress', opacity: 1 }}
      hoverStyle={{ bg: '$brandHover', opacity: 1 }}
      {...props}
    />
  );
}
