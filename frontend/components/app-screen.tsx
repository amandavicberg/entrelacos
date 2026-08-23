import type { PropsWithChildren } from 'react';
import { YStack } from 'tamagui';

export function AppScreen({ children }: PropsWithChildren) {
  return (
    <YStack flex={1} bg="$background" p="$4">
      {children}
    </YStack>
  );
}
