import type { ComponentProps } from 'react';
import { Button } from 'tamagui';

type BrandButtonProps = ComponentProps<typeof Button>;

export function BrandButton(props: BrandButtonProps) {
  return (
    <Button
      bg="$brand"
      color="$brandContrast"
      fontFamily="$heading"
      minH="$control"
      height="auto"
      py="$3"
      disabledStyle={{ opacity: 0.55 }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$outlineColor', outlineStyle: 'solid' }}
      rounded="$control"
      pressStyle={{ opacity: 0.82 }}
      hoverStyle={{ opacity: 0.92 }}
      {...props}
    />
  );
}
