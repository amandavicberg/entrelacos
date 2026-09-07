import type { ComponentProps } from 'react';
import { YStack } from 'tamagui';

export function AppScreen({ children, ...props }: ComponentProps<typeof YStack>) {
  return (
    <YStack flex={1} bg="$background" p="$4" {...props}>
      {children}
    </YStack>
  );
}
