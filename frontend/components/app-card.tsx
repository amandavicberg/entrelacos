import type { ComponentProps } from 'react';
import { Card, SizableText, YStack } from 'tamagui';

type AppCardProps = ComponentProps<typeof Card> & { title?: string };

export function AppCard({ title, children, ...props }: AppCardProps) {
  return (
    <Card borderWidth={1} background="$surface" borderColor="$borderColor" rounded="$panel"
      p="$4" minW={0} maxW="100%" {...props}>
      <YStack gap="$4" minW={0}>
        {title ? <YStack pb="$3" borderBottomWidth={1} borderColor="$borderColor">
          <SizableText role="heading" color="$color" fontFamily="$heading" size="$5">{title}</SizableText>
        </YStack> : null}
        {children}
      </YStack>
    </Card>
  );
}
