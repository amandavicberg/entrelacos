import type { ComponentProps } from 'react';
import { Button } from 'tamagui';

type BrandButtonProps = ComponentProps<typeof Button>;

export function BrandButton(props: BrandButtonProps) {
  return (
    <Button
      bg="$brand"
      color="$brandContrast"
      fontFamily="$heading"
      minH="$touchTarget"
      rounded="$control"
      pressStyle={{ opacity: 0.82 }}
      hoverStyle={{ opacity: 0.92 }}
      {...props}
    />
  );
}
